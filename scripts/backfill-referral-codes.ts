import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

function generateReferralCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const REFERRAL_BASE_URL = process.env.REFERRAL_BASE_URL || 'https://www.access-sellr.com/ref';

async function main() {
  const users = await prisma.user.findMany({
    where: { referralCode: null },
    select: { id: true }
  });

  let created = 0;
  for (const user of users) {
    let code;
    let isUnique = false;
    for (let i = 0; i < 5; i++) {
      code = generateReferralCode();
      const exists = await prisma.referralCode.findUnique({ where: { code } });
      if (!exists) {
        isUnique = true;
        break;
      }
    }
    if (!isUnique) {
      console.error(`Failed to generate unique code for user ${user.id}`);
      continue;
    }
    await prisma.referralCode.create({
      data: {
        code,
        url: `${REFERRAL_BASE_URL}/${code}`,
        userId: user.id,
      }
    });
    created++;
  }
  console.log(`Backfill complete. Created ${created} referral codes.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 