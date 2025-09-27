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

  // Optional: Create test realms with different configurations
  const CREATE_TEST_REALMS = true; // Set to true if you want to create test realms

  if (CREATE_TEST_REALMS) {
    console.log("\n🎯 Creating test realms...\n");

    // Test Realm 1: Open Global Event
    console.log("1️⃣ Creating Open Global Event...");
    const testRealm1Tx = await realmFactory.createRealm(
      "Global Gaming Tournament", // title
      "Open to all countries, 18+ only", // description
      40705000, // latitude (NYC)
      -74009000, // longitude (NYC)
      ethers.parseEther("0.1"), // ticketPrice (0.1 ETH)
      100, // capacity
      Math.floor(Date.now() / 1000) + 86400 * 7, // realmDate (1 week from now)
      false, // requiresMaleOnly
      false, // requiresFemaleOnly
      18, // minimumAge
      [], // allowedCountries (empty = all allowed)
      [] // blockedCountries (empty = none blocked)
    );
    await testRealm1Tx.wait();

    // Test Realm 2: US/Canada Only Event
    console.log("2️⃣ Creating US/Canada Only Event...");
    const testRealm2Tx = await realmFactory.createRealm(
      "North America Championship", // title
      "Exclusive to US and Canada residents, 21+ only", // description
      43651070, // latitude (Toronto)
      -79383184, // longitude (Toronto)
      ethers.parseEther("0.2"), // ticketPrice (0.2 ETH)
      50, // capacity
      Math.floor(Date.now() / 1000) + 86400 * 14, // realmDate (2 weeks from now)
      false, // requiresMaleOnly
      false, // requiresFemaleOnly
      21, // minimumAge
      ["US", "CA"], // allowedCountries
      [] // blockedCountries
    );
    await testRealm2Tx.wait();

    // Test Realm 3: Global Event with Sanctions Compliance
    console.log("3️⃣ Creating Global Event with Compliance Restrictions...");
    const testRealm3Tx = await realmFactory.createRealm(
      "International Tech Conference", // title
      "Global tech event with compliance restrictions", // description
      51507400, // latitude (London)
      -124000, // longitude (London)
      ethers.parseEther("0.05"), // ticketPrice (0.05 ETH)
      200, // capacity
      Math.floor(Date.now() / 1000) + 86400 * 30, // realmDate (1 month from now)
      false, // requiresMaleOnly
      false, // requiresFemaleOnly
      25, // minimumAge
      [], // allowedCountries (empty = all allowed)
      ["IR", "KP", "SY"] // blockedCountries (sanctions compliance)
    );
    await testRealm3Tx.wait();

    // Test Realm 4: EU Only Event
    console.log("4️⃣ Creating EU Only Event...");
    const testRealm4Tx = await realmFactory.createRealm(
      "European Business Summit", // title
      "Exclusive to European Union members", // description
      52520008, // latitude (Berlin)
      13404954, // longitude (Berlin)
      ethers.parseEther("0.3"), // ticketPrice (0.3 ETH)
      75, // capacity
      Math.floor(Date.now() / 1000) + 86400 * 21, // realmDate (3 weeks from now)
      false, // requiresMaleOnly
      false, // requiresFemaleOnly
      30, // minimumAge
      ["DE", "FR", "IT", "ES", "NL", "BE", "AT", "PT"], // allowedCountries (EU sample)
      ["RU"] // blockedCountries (explicit exclusion)
    );
    await testRealm4Tx.wait();

    console.log("\n📊 Test Realms Created Successfully!");

    // Get all realms and display their details
    const updatedTotalRealms = await realmFactory.getTotalRealms();
    console.log("📈 Total realms after creation:", updatedTotalRealms.toString());

    // Get details of all created realms
    const allRealms = await realmFactory.getRealms(0, Number(updatedTotalRealms));
    
    console.log("\n📋 Created Realms Details:");
    for (let i = 0; i < allRealms.length; i++) {
      const realmAddress = allRealms[i];
      console.log(`\n🏛️ Realm ${i + 1}: ${realmAddress}`);
      
      try {
        const Realm = await ethers.getContractFactory("Realm");
        const realm = Realm.attach(realmAddress);
        
        // Get basic details
        const details = await realm.getRealmDetails();
        console.log("  📝 Title:", details[0]);
        console.log("  💰 Ticket Price:", ethers.formatEther(details[2]), "ETH");
        console.log("  👥 Capacity:", details[3].toString());
        console.log("  📅 Realm Date:", new Date(Number(details[4]) * 1000).toLocaleDateString());
        console.log("  🎫 Current Attendees:", details[5].toString());
        
        // Get requirements
        const requirements = await realm.getRealmRequirements();
        console.log("  🔒 Requirements:");
        console.log("    👨 Male Only:", requirements[0]);
        console.log("    👩 Female Only:", requirements[1]);
        console.log("    🎂 Min Age:", requirements[2].toString());
        console.log("    ✅ Allowed Countries:", requirements[3].length > 0 ? requirements[3].join(", ") : "All countries");
        console.log("    ❌ Blocked Countries:", requirements[4].length > 0 ? requirements[4].join(", ") : "None");
        
      } catch (error) {
        console.log("  ❌ Error fetching details:", error.message);
      }
    }
  }

  console.log("\n🎉 All done! Your contracts are ready to use.");

  // Instructions for users
  console.log("\n📖 Next Steps:");
  console.log("1. Update VERIFICATION_CONFIG_ID in RealmFactory contract if needed");
  console.log("2. Verify contracts on block explorer if needed");
  console.log("3. Start creating realms with various verification requirements!");
  console.log("\n💡 Available Verification Options:");
  console.log("   • Age restrictions (minimum age)");
  console.log("   • Gender requirements (male/female only)");
  console.log("   • Country whitelist (specific countries only)");
  console.log("   • Country blacklist (exclude specific countries)");
  console.log("   • Mixed requirements (combine multiple restrictions)");

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