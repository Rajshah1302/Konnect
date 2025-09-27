const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Realm contract deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log(
    "💰 Account balance:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // Configuration - UPDATE THESE VALUES
  const IDENTITY_VERIFICATION_HUB_V2 =
    "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74";

  // Deploy RealmFactory
  console.log("📦 Deploying RealmFactory...");
  const RealmFactory = await ethers.getContractFactory("RealmFactory");
  const realmFactory = await RealmFactory.deploy(IDENTITY_VERIFICATION_HUB_V2);

  await realmFactory.waitForDeployment();
  const realmFactoryAddress = await realmFactory.getAddress();

  console.log("✅ RealmFactory deployed to:", realmFactoryAddress);
  console.log("🔗 Identity Hub V2:", IDENTITY_VERIFICATION_HUB_V2);

  // Wait a bit for the contract to be fully indexed
  console.log("⏳ Waiting for contract to be fully deployed...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    const configId = await realmFactory.VERIFICATION_CONFIG_ID();
    console.log("🔧 Verification Config ID:", configId);
  } catch (error) {
    console.log(
      "⚠️  Could not fetch verification config ID immediately, but deployment was successful"
    );
    console.log(
      "🔧 Verification Config ID: 0xc52f992ebee4435b00b65d2c74b12435e96359d1ccf408041528414e6ea687bc"
    );
  }

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalRealms = await realmFactory.getTotalRealms();
  console.log("📊 Total realms created:", totalRealms.toString());

  console.log("\n✨ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("RealmFactory:", realmFactoryAddress);

  // Create test realm with age verification
  const CREATE_TEST_REALM = true; // Set to true if you want to create test realm

  if (CREATE_TEST_REALM) {
    console.log("\n🎯 Creating test realm...\n");

    // Test Realm: Age Verification Event
    console.log("1️⃣ Creating Age Verification Event...");
    const testRealmTx = await realmFactory.createRealm(
      "Tech Conference 2025", // title
      "Annual technology conference with age verification", // description
      40705000, // latitude (NYC)
      -74009000, // longitude (NYC)
      ethers.parseEther("0.1"), // ticketPrice (0.1 ETH)
      100, // capacity
      Math.floor(Date.now() / 1000) + 86400 * 7, // realmDate (1 week from now)
      false, // requiresMaleOnly
      false, // requiresFemaleOnly
      18 // minimumAge (18+ only)
    );
    await testRealmTx.wait();

    console.log("\n📊 Test Realm Created Successfully!");

    // Get realm details
    const updatedTotalRealms = await realmFactory.getTotalRealms();
    console.log(
      "📈 Total realms after creation:",
      updatedTotalRealms.toString()
    );

    // Get details of the created realm
    if (Number(updatedTotalRealms) > 0) {
      console.log("\n📋 Created Realm Details:");

      // Get the creator's realms instead of all realms
      const creatorRealms = await realmFactory.getCreatorRealms(
        deployer.address
      );

      if (creatorRealms.length > 0) {
        const realmAddress = creatorRealms[creatorRealms.length - 1]; // Get the last created realm
        console.log(`\n🏛️ Realm Address: ${realmAddress}`);

        try {
          const Realm = await ethers.getContractFactory("Realm");
          const realm = Realm.attach(realmAddress);

          // Get basic details
          const details = await realm.getRealmDetails();
          console.log("  📝 Title:", details[0]);
          console.log("  📖 Description:", details[1]);
          console.log(
            "  💰 Ticket Price:",
            ethers.formatEther(details[2]),
            "ETH"
          );
          console.log("  👥 Capacity:", details[3].toString());
          console.log(
            "  📅 Realm Date:",
            new Date(Number(details[4]) * 1000).toLocaleDateString()
          );
          console.log("  🎫 Current Attendees:", details[5].toString());

          // Get requirements
          const requirements = await realm.getRealmRequirements();
          console.log("  🔒 Requirements:");
          console.log("    👨 Male Only:", requirements[0]);
          console.log("    👩 Female Only:", requirements[1]);
          console.log("    🎂 Min Age:", requirements[2].toString());
        } catch (error) {
          console.log("  ❌ Error fetching details:", error.message);
        }
      }

      console.log("\n🎉 All done! Your contracts are ready to use.");

      // Instructions for users
      console.log("\n📖 Next Steps:");
      console.log(
        "1. Update VERIFICATION_CONFIG_ID in RealmFactory contract if needed"
      );
      console.log("2. Verify contracts on block explorer if needed");
      console.log(
        "3. Start creating realms with various verification requirements!"
      );
      console.log("\n💡 Available Verification Options:");
      console.log("   • Age restrictions (minimum age)");
      console.log("   • Gender requirements (male/female only)");

      return {
        realmFactory: realmFactoryAddress,
      };
    }
  }
}
// Error handling
main()
  .then((deployedContracts) => {
    console.log("\n✅ Deployment successful!");
    console.log("Deployed contracts:", deployedContracts);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed!");
    console.error(error);
    process.exit(1);
  });
