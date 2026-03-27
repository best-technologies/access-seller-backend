import { Body, Controller, Post, UseInterceptors, UploadedFiles, Get, HttpCode, UseGuards, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RequestPasswordResetDTO, ResetPasswordDTO, SignInDto, RequestLoginOtpDTO, VerifyEmailOTPDto, RegisterDto, VerifyOTPAndResetPasswordDTO } from 'src/shared/dto/auth.dto';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';

import { OnboardStoreDTO } from 'src/shared/dto/store.dto';
import { JwtGuard } from './guard';

interface ErrorResponse {
    success: false;
    message: string;
    error: any;
    statusCode: number;
}

interface SuccessResponse {
    success: true;
    message: string;
    data: any;
    length?: number;
    meta?: any;
    statusCode: number;
}

type ApiResponse = ErrorResponse | SuccessResponse;

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('onboard-store')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'cac_or_approval_letter', maxCount: 1 },
            { name: 'utility_bill', maxCount: 1 },
            { name: 'tax_cert', maxCount: 1 }
        ]),
        FileValidationInterceptor
    )
    async onboardStore(
        @Body() dto: OnboardStoreDTO,
        @UploadedFiles() files: {
            cac_or_approval_letter?: Express.Multer.File[],
            utility_bill?: Express.Multer.File[],
            tax_cert?: Express.Multer.File[]
        }
    ): Promise<ApiResponse> {
        const fileArray = [
            files.cac_or_approval_letter?.[0],
            files.utility_bill?.[0],
            files.tax_cert?.[0]
        ].filter((file): file is Express.Multer.File => file !== undefined);

        return this.authService.onboardStore(dto, fileArray) as Promise<ApiResponse>;
    }

    @Post('admin-login-otp')
    signUp(@Body() dto: RequestLoginOtpDTO) {
        return this.authService.requestLoginOtp(dto)
    }

    @Post("admin-verify-login-otp")
    verifyEmailOTPAndSignIn(@Body() dto: VerifyEmailOTPDto, @Request() req: { ip?: string; headers?: { [key: string]: string } }) {
        return this.authService.verifyEmailOTPAndSignIn(dto, {
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent'],
        });
    }

    @Post("sign-in")
    @HttpCode(200)
    signIn(@Body() dto: SignInDto, @Request() req: { ip?: string; headers?: { [key: string]: string } }) {
        return this.authService.signIn(dto, {
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent'],
        });
    }

    @Post("register")
    @HttpCode(201)
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto)
    }

    @UseGuards(JwtGuard)
    @Get("fetch-user-details")
    @HttpCode(200)
    fetchLoggedInUserProfile(@Request() req) {
        return this.authService.fetchLoggedInUserProfile(req.user);
    }

    @Post("request-password-reset-email")
    @HttpCode(200)
    requestPasswordResetOTP(@Body() dto: RequestPasswordResetDTO) {
        return this.authService.requestPasswordResetOTP(dto)
    }

    @Post("verify-password-reset-email")
    @HttpCode(200)
    verifyOTPAndResetPassword(@Body() dto: VerifyOTPAndResetPasswordDTO) {
        return this.authService.verifyOTPAndResetPassword(dto)
    }

    @Post("reset-password")
    @HttpCode(200)
    resetPassword(@Body() dto: ResetPasswordDTO) {
        return this.authService.resetPassword(dto)
    }

    @Post('resend-login-otp')
    resendLoginOtp(@Body() dto: RequestLoginOtpDTO) {
        return this.authService.resendLoginOtp(dto);
    }
}
 