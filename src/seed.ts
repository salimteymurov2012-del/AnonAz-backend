import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const adminPass = await bcrypt.hash("admin123", 10);
  const userPass = await bcrypt.hash("1234", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password: adminPass, role: "admin", gender: "male", age: 25, city: "Bakı", district: "Nəsimi", description: "Admin", isOnline: false },
  });

  const users = [
    { username: "ayxan_77", password: userPass, gender: "male", age: 22, city: "Bakı", district: "Nəsimi", description: "Musiqi və kino həvəskarı" },
    { username: "leyla_m", password: userPass, gender: "female", age: 20, city: "Sumqayıt", district: "Mərkəz", description: "Sevimli kitablar və gəzintilər" },
    { username: "ruslan_33", password: userPass, gender: "male", age: 25, city: "Gəncə", district: "Kəpəz", description: "İT sahəsində çalışıram" },
    { username: "sevda_01", password: userPass, gender: "female", age: 19, city: "Xırdalan", district: "Mərkəz", description: "Tələbə, səyahət və fotoqrafiya" },
    { username: "elvin_q", password: userPass, gender: "male", age: 27, city: "Mingəçevir", district: "Mərkəz", description: "Səmimi ünsiyyət axtarıram" },
    { username: "nigar_99", password: userPass, gender: "female", age: 21, city: "Şirvan", district: "Mərkəz", description: "Dostluq və maraqlı söhbətlər" },
    { username: "kenan_22", password: userPass, gender: "male", age: 24, city: "Lənkəran", district: "Mərkəz", description: "Təbiət həvəskarı" },
    { username: "aysel_m", password: userPass, gender: "female", age: 23, city: "Şəki", district: "Mərkəz", description: "Şirniyyatçı" },
    { username: "murad_88", password: userPass, gender: "male", age: 26, city: "Bakı", district: "Xətai", description: "Developer" },
    { username: "zulya_00", password: userPass, gender: "female", age: 18, city: "Sumqayıt", district: "Mərkəz", description: "İncəsənət və musiqi" },
    { username: "rasim_21", password: userPass, gender: "male", age: 28, city: "Bakı", district: "Yasamal", description: "Sakit insan" },
    { username: "gunay_04", password: userPass, gender: "female", age: 20, city: "Gəncə", district: "Nizami", description: "Tələbə" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, password: userPass, isOnline: false },
    });
  }

  console.log("Seed done");
  await prisma.$disconnect();
}

seed();
