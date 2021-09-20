"use strict";
const pulumi = require("@pulumi/pulumi");
const azure = require("@pulumi/azure-native");
const fs = require("fs")

const RANCHER_PREFIX = 'rancher-pulumi-test'

// Create an Azure Resource Group
const resourceGroup = new azure.resources.ResourceGroup(`${RANCHER_PREFIX}-group`);

// Create a Virtual Network for VM
const virtualNetwork = new azure.network.VirtualNetwork("virtualNetwork", {
    addressSpace: {
        addressPrefixes: ["10.0.0.0/16"],
    },
    location: "westeurope",
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: `${RANCHER_PREFIX}-vnet`,
});

const networkSecurityGroup = new azure.network.NetworkSecurityGroup('networkSecurityGroup', {
    location: 'westeurope',
    networkSecurityGroupName: `${RANCHER_PREFIX}-security-group`,
    resourceGroupName: resourceGroup.name,
    securityRules: [
        {
            access: "Allow",
            direction: "Inbound",
            name: `${RANCHER_PREFIX}-security-group-rule-1`,
            priority: 100,
            protocol: "TCP",
            destinationAddressPrefix: "*",
            destinationPortRange: "*",
            sourceAddressPrefix: "*",
            sourcePortRange: "*",
        }
    ]
})

const subnet = new azure.network.Subnet("subnet", {
    addressPrefix: "10.0.0.0/16",
    resourceGroupName: resourceGroup.name,
    subnetName: `${RANCHER_PREFIX}-subnet`,
    virtualNetworkName: virtualNetwork.virtualNetworkName,
    
    networkSecurityGroup: {
        id: networkSecurityGroup.id
    }
});

const publicIPAddress = new azure.network.PublicIPAddress("publicIPAddress", {
    dnsSettings: {
        domainNameLabel: "dnslbl",
    },
    location: "westeurope",
    publicIpAddressName: `${RANCHER_PREFIX}-public-ip`,
    resourceGroupName: resourceGroup.name,
});

const networkInterface = new azure.network.NetworkInterface("networkInterface", {
    enableAcceleratedNetworking: true,
    ipConfigurations: [{
        privateIPAllocationMethod: 'Dynamic',
        name: `${RANCHER_PREFIX}-ipconfig`,
        publicIPAddress: {
            id: publicIPAddress.id
        },
        subnet: {
            id: subnet.id
        },
    }],
    location: "westeurope",
    networkInterfaceName: `${RANCHER_PREFIX}-nic`,
    resourceGroupName: resourceGroup.name,
});

const virtualMachine = new azure.compute.VirtualMachine("virtualMachine", {
    hardwareProfile: {
        vmSize: "Standard_D1_v2",
    },
    location: "westeurope",
    networkProfile: {
        networkInterfaces: [{
            id: networkInterface.id,
            primary: true,
        }],
    },
    osProfile: {
        customData: fs.readFileSync("./installation.sh", {
            encoding: "base64"
        }),
        adminPassword: "IamDavid01!~",
        adminUsername: `${RANCHER_PREFIX}-admin`,
        computerName: `${RANCHER_PREFIX}-computer`,
        linuxConfiguration: {
            patchSettings: {
                assessmentMode: "ImageDefault",
            },
            provisionVMAgent: true,
        },
    },

    resourceGroupName: resourceGroup.name,
    storageProfile: {
        imageReference: {
            offer: "UbuntuServer",
            publisher: "Canonical",
            sku: "16.04-LTS",
            version: "latest",
        },
        osDisk: {
            caching: "ReadWrite",
            createOption: "FromImage",
            managedDisk: {
                storageAccountType: "Standard_LRS",
            },
            name: `${RANCHER_PREFIX}-disk`,
        },
    },
    subnet: subnet.id,
    vmName: `${RANCHER_PREFIX}-vm`,
});


// // Create an Azure resource (Storage Account)
// const storageAccount = new azure.storage.StorageAccount("sa", {
//     resourceGroupName: resourceGroup.name,
//     sku: {
//         name: "Standard_LRS",
//     },
//     kind: "StorageV2",
// });

// // Export the primary key of the Storage Account
// const storageAccountKeys = pulumi.all([resourceGroup.name, storageAccount.name]).apply(([resourceGroupName, accountName]) =>
//     azure.storage.listStorageAccountKeys({ resourceGroupName, accountName }));

// // Export the primary storage key for the storage account
// exports.primaryStorageKey = storageAccountKeys.keys[0].value;
