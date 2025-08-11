
    
    // Get effective shipping method (from root or shippingInfo)
    const shippingMethod = dto.shippingMethod || dto.shippingInfo?.shippingMethod;
    const selectedDepotId = dto.selectedDepotId || dto.shippingInfo?.selectedDepotId;
    
    if (!shippingMethod) {
      throw new BadRequestException('Shipping method is required');
    }
    
    if (shippingMethod === 'pickup-depot' && !selectedDepotId) {
      throw new BadRequestException('Depot ID is required for depot pickup');
    }

    this.logger.log(`Shipping method: ${shippingMethod}`);
    
    // 1. Validate all products exist and have enough stock
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return ResponseHelper.error(`Product with ID ${item.productId} not found`, null, 404);
      }
      if (item.quantity > product.stock) {
        this.logger.log(colors.red(`The available quantity for '${product.name}' is ${product.stock}, which is less than the quantity you want to purchase: (${item.quantity}). Please try reloading, check back later, or try again.`))
        return ResponseHelper.error(
          `The available quantity for '${product.name}' is ${product.stock}, which is less than the quantity you want to purchase: (${item.quantity}). Please try reloading, check back later, or try again.`,
          null,
          400
        );
      }
    }

    // console.log("Data from dto:", dto);

    // --- Move non-DB operations outside transaction ---
    // Prepare user info
    let user = await this.prisma.user.findFirst({ where: { email: dto.shippingInfo?.email } });
    let userId = user?.id;
    let userForOrder = user;
    let createdUser = false;
    if (!user) {
      // Hash password outside transaction
      const plainPassword = 'maximus123';
      const hashedPassword = await argon2.hash(plainPassword);
      user = await this.prisma.user.create({
        data: {
          email: dto.shippingInfo?.email || '',
          first_name: dto.shippingInfo?.firstName || '',
          last_name: dto.shippingInfo?.lastName || '',
          phone_number: dto.shippingInfo?.phone || '',
          address: dto.shippingInfo?.address || '',
          password: hashedPassword,
          guest_password: plainPassword,
          role: 'user',
        }
      });
      userId = user.id;
      userForOrder = user;
      createdUser = true;
    }
    if (!userId) {
      this.logger.error("User ID could not be determined for order creation")
      throw new Error('User ID could not be determined for order creation');
    }

    // generate unique order id
    let orderId: string = '';
    while (true) {
      orderId = generateOrderId();
      const exists = await this.prisma.order.findFirst({ where: { orderId } });
      if (!exists) break;
    }
    this.logger.log(`Order id: ${orderId}`);

    // Generate unique tracking number outside transaction
    let trackingNumber = '';
    for (let i = 0; i < 5; i++) { // Try up to 5 times
      const candidate = generateTrackingId();
      const exists = await this.prisma.order.findFirst({ where: { trackingNumber: candidate } });
      if (!exists) {
        trackingNumber = candidate;
        break;
      }
    }
    if (!trackingNumber) {
      throw new Error('Failed to generate unique tracking number');
    }

    // --- Start transaction for DB-only operations ---
    const { order } = await this.prisma.$transaction(async (tx) => {
      // Find or create shipping address for doorstep delivery
      let shippingAddressId: string | undefined = undefined;
      if (shippingMethod === 'doorstep' && dto.shippingInfo && userId) {
        let shippingAddress = await tx.shippingAddress.findFirst({
          where: {
            userId,
            city: dto.shippingInfo.city || '',
            state: dto.shippingInfo.state || '',
          }
        });
        if (!shippingAddress) {
          shippingAddress = await tx.shippingAddress.create({
            data: {
              userId,
              firstName: dto.shippingInfo.firstName || '',
              lastName: dto.shippingInfo.lastName || '',
              email: dto.shippingInfo.email || '',
              phone: dto.shippingInfo.phone || '',
              state: dto.shippingInfo.state || '',
              city: dto.shippingInfo.city || '',
              houseAddress: dto.shippingInfo.houseAddress || '',
              address: dto.shippingInfo.address || '',
            }
          });
        }
        shippingAddressId = shippingAddress.id;
      }

      // Find storeId from first product or fallback to first store
      let storeId: string | undefined = undefined;
      if (dto.items.length > 0) {
        const firstProduct = await tx.product.findUnique({ where: { id: dto.items[0].productId } });
        if (firstProduct && firstProduct.storeId) {
          storeId = firstProduct.storeId;
        }
      }
      // if (!storeId) {
      //   const firstStore = await tx.store.findFirst();
      //   if (!firstStore) throw new Error('No store found in the database to attach to the order.');
      //   storeId = firstStore.id;
      // }

      // Prepare order data
      const orderData: any = {
        orderStatus: 'pending',
        orderId,
        total_amount: dto.total,
        orderPaymentStatus: 'awaiting_payment',
        shipmentStatus: 'awaiting_payment',
        trackingNumber,
        isPartialPayment: !!dto.partialPayment,
        partialPayNow: dto.partialPayment?.payNow,
        partialPayLater: dto.partialPayment?.payLater,
        partialAllowedPercent: dto.partialPayment?.allowedPercentage,
        partialSelectedPercent: dto.partialPayment?.selectedPercentage,
        fullPayNow: dto.fullPayment?.payNow,
        fullPayLater: dto.fullPayment?.payLater,
        referralCode: dto.referralCode,
        shippingCost: dto.shipping || 0,
        promoCode: dto.promoCode,
        promoDiscountPercent: dto.promoDiscountPercent,
        promoDiscountAmount: dto.promoDiscountAmount,
        user: { connect: { id: userId } },
        store: { connect: { id: storeId } },
        // shippingMethod, // Add shipping method to order
      };
      
      // Only connect shipping address for doorstep delivery
      if (shippingMethod === 'doorstep' && shippingAddressId) {
        orderData.shippingAddress = { connect: { id: shippingAddressId } };
      }
      // Create the order
      const order = await tx.order.create({ 
        data: orderData,
        include: { user: true } // Include user for shipping information
      }); 

      // Prepare shipping information
      const shippingInfoData: any = {
        order: { connect: { id: order.id } },
        user: { connect: { id: userId } },
        shippingMethod: shippingMethod,
        isPickup: shippingMethod === 'pickup-depot' || shippingMethod === 'pickup-park',
        trackingNumber: trackingNumber,
        fullName: `${dto.shippingInfo?.firstName || ''} ${dto.shippingInfo?.lastName || ''}`.trim(),
        phoneNumber: dto.shippingInfo?.phone || '',
        email: dto.shippingInfo?.email || '',
      };

      // Add shipping details based on shipping method
      switch (shippingMethod) {
        case 'pickup-depot':
          // For depot pickup, use depot address
          if (selectedDepotId) {
            const existingDepot = await tx.depot.findUnique({ where: { id: selectedDepotId } });
            if (existingDepot) {
              shippingInfoData.addressLine1 = existingDepot.depo_officer_house_address || '';
              shippingInfoData.city = existingDepot.city || '';
              shippingInfoData.state = existingDepot.state || '';
              // Connect the depot using the relation
              shippingInfoData.depot = {
                connect: { id: existingDepot.id }
              };
            }
          }
          break;
          
        case 'pickup-park':
          // For park pickup, store park location and pickup date
          shippingInfoData.parkLocation = dto.shippingInfo?.parkLocation || '';
          if (dto.shippingInfo?.pickupDate) {
            shippingInfoData.pickupDate = new Date(dto.shippingInfo.pickupDate);
          }
          shippingInfoData.city = dto.shippingInfo?.city || '';
          shippingInfoData.state = dto.shippingInfo?.state || '';
          break;
          
        case 'doorstep':
          // For doorstep delivery, store full address and delivery instructions
          shippingInfoData.addressLine1 = dto.shippingInfo?.houseAddress || '';
          shippingInfoData.addressLine2 = dto.shippingInfo?.address || '';
          shippingInfoData.city = dto.shippingInfo?.city || '';
          shippingInfoData.state = dto.shippingInfo?.state || '';
          shippingInfoData.deliveryInstructions = dto.shippingInfo?.deliveryInstructions || '';
          break;
      }

      // Log shipping information for debugging
      // this.logger.log(`Saving shipping information for order with shipping method: ${dto.shippingMethod}`);
      // this.logger.debug('Shipping info data:', JSON.stringify(shippingInfoData, null, 2));

      // Log the shipping info data before creation
      // this.logger.log('Attempting to create shipping information with data:', {
      //   orderId: order.id,
      //   userId,
      //   shippingMethod: shippingMethod,
      //   hasShippingInfo: !!dto.shippingInfo,
      //   shippingInfoKeys: dto.shippingInfo ? Object.keys(dto.shippingInfo) : []
      // });

      let shippingInfo;
      try {
        // Create shipping information record using the transaction client so it can see the newly created order
        shippingInfo = await tx.shippingInformation.create({
          data: shippingInfoData,
        });

        this.logger.log(`Shipping information saved with ID: ${shippingInfo.id}`);
      } catch (error) {
        this.logger.error('Error creating shipping information:', {
          error: error.message,
          errorDetails: error,
          shippingInfoData: JSON.stringify(shippingInfoData, (key, value) => 
            key === 'password' ? '***' : value // Don't log sensitive data
          )
        });
        throw new Error(`Failed to create shipping information: ${error.message}`);
      }

      // Create order items
      await Promise.all(dto.items.map(item =>
        tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.price * item.quantity,
          }
        })
      ));

      return { order };
    }, { timeout: 10000 }); // 10 seconds

    // 3. Prepare Paystack payload
    const amount = Math.round((dto.partialPayment?.payNow || dto.total) * 100);
    const payload = {
      email: userForOrder?.email,
      callback_url: dto.callbackUrl,
      amount,
      metadata: {
        orderId: order.id,
        userId: userForOrder?.id,
        items: dto.items,
        promoCode: dto.promoCode,
        promoDiscountPercent: dto.promoDiscountPercent,
        promoDiscountAmount: dto.promoDiscountAmount,
        subtotal: dto.subtotal,
        shipping: dto.shipping,
        total: dto.total,
        partialPayment: dto.partialPayment,
        fullPayment: dto.fullPayment,
        shippingMethod: shippingMethod,
        ...(selectedDepotId && { selectedDepotId }),
      },
    };

    // 4. Initialise Paystack payment
    let paystackResponse: any;
    try {
      paystackResponse = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        payload,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // 5. Update the order with paystack fields
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paystackReference: paystackResponse.data.data.reference,
          paystackAuthorizationUrl: paystackResponse.data.data.authorization_url,
          paystackAccessCode: paystackResponse.data.data.access_code,
        }
      });
    } catch (error) {
      console.error('Paystack initialize error:', error.response?.data || error.message);
      return ResponseHelper.error(error.response?.data?.message || error.message, error.response?.data, error.response?.status || 500);
    }

    // 6. Return formatted response
    const formattedResponse = {
      orderId: order.orderId,
      userId: userForOrder?.id,
      paystackResponse: paystackResponse?.data.data
    };

    this.logger.log("New order successfully created")
    return new ApiResponse(
      true,
      'Cart checkout payment successfully initiated',
      formattedResponse
    );