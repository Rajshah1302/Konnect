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
  // console.log("👤 Owner:", await realmFactory.owner());
  console.log(
    "🔧 Verification Config ID:",
    await realmFactory.VERIFICATION_CONFIG_ID()
  );

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const totalRealms = await realmFactory.getTotalRealms();
  console.log("📊 Total realms created:", totalRealms.toString());

  console.log("\n✨ Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("RealmFactory:", realmFactoryAddress);

  // Optional: Create a test realm
  const CREATE_TEST_REALM = true; // Set to true if you want to create a test realm

  if (CREATE_TEST_REALM) {
    console.log("\n🎯 Creating test realm...");

    const testRealmTx = await realmFactory.createRealm(
      "Test Realm", // title
      "A test realm for demo", // description
      40705000, // latitude (NYC)
      -74009000, // longitude (NYC)
      ethers.parseEther("0.1"), // ticketPrice (0.1 ETH)
      50, // capacity
      Math.floor(Date.now() / 1000) + 86400 * 7, // realmDate (1 week from now)
      false, // requiresMaleOnly
      false // requiresFemaleOnly
    );

    const receipt = await testRealmTx.wait();

    // Get the realm address from the event
    const realmCreatedEvent = receipt.logs.find(
      (log) => log.fragment && log.fragment.name === "RealmCreated"
    );

    if (realmCreatedEvent) {
      const testRealmAddress = realmCreatedEvent.args[0];
      console.log("✅ Test realm created at:", testRealmAddress);

      // Get realm details
      const Realm = await ethers.getContractFactory("Realm");
      const testRealm = Realm.attach(testRealmAddress);
      const details = await testRealm.getRealmDetails();

      console.log("📊 Test Realm Details:");
      console.log("  Title:", details[0]);
      console.log("  Description:", details[1]);
      console.log("  Ticket Price:", ethers.formatEther(details[2]), "ETH");
      console.log("  Capacity:", details[3].toString());
      console.log("  Attendee Count:", details[5].toString());
    }
  }

  console.log("\n🎉 All done! Your contracts are ready to use.");

  // Instructions for users
  console.log("\n📖 Next Steps:");
  console.log("1. Update VERIFICATION_CONFIG_ID in RealmFactory contract");
  console.log("2. Verify contracts on block explorer if needed");
  console.log("3. Start creating realms!");

  return {
    realmFactory: realmFactoryAddress,
  };
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
