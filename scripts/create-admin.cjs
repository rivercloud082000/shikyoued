const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "huampuque2000@gmail.com";
  const password = "Huampuque8";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
      isAllowed: true,
    },
  });

  console.log("Admin creado:", user);
}

main()
  .then(() => {
    console.log("Listo");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
