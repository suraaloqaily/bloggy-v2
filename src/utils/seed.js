const prisma = require("./connect");

async function main() {
  const comment = await prisma.comment.findUnique({
    where: { id: "cm354meu6000t4z2wzzj2autg" },
  });

  const post = await prisma.post.findUnique({
    where: { slug: "nnnnnnnnnnnnnn" },
  });
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
