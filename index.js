"use strict";
const pulumi = require("@pulumi/pulumi");
const azure = require("@pulumi/azure-native");
const fs = require("fs")

const RANCHER_PREFIX = 'rancher-pulumi'

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

const subnet = new azure.network.Subnet("subnet", {
    addressPrefix: "10.0.0.0/16",
    resourceGroupName: resourceGroup.name,
    subnetName: `${RANCHER_PREFIX}-subnet`,
    virtualNetworkName: virtualNetwork.virtualNetworkName,
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

// new azure.compute.L

const virtualMachine = new azure.compute.VirtualMachine("virtualMachine", {
    hardwareProfile: {
        vmSize: "Standard_D2s_v3",
    },
    location: "westeurope",
    networkProfile: {
        networkInterfaces: [{
            id: networkInterface.id,
            primary: true,
        }],
    },
    osProfile: {
        adminPassword: "IamDavid01!~",
        adminUsername: `${RANCHER_PREFIX}-admin`,
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
                storageAccountType: "Premium_LRS",
            },
            name: `${RANCHER_PREFIX}-disk`,
        },
    },
    subnet: subnet.id,
    vmName: `${RANCHER_PREFIX}-vm`,
});


// const linuxVirtualMachine = new azure.compute.LinuxVirtualMachine("linuxVirtualMachine", {
//     resourceGroupName: resourceGroup.name,
//     location: resourceGroup.location,
//     size: "Standard_F2",
//     adminUsername: `${RANCHER_PREFIX}-admin`,
//     adminPassword: "IamDavid01!~",
//     networkInterfaceIds: [networkInterface.id],
//     // adminSshKeys: [{
//     //     username: "adminuser",
//     //     publicKey: fs.readFileSync("~/.ssh/id_rsa.pub"),
//     // }],
//     customData: fs.readFileSync("./installation.sh"),
//     osDisk: {
//         caching: "ReadWrite",
//         storageAccountType: "Standard_LRS",
//     },
//     sourceImageReference: {
//         publisher: "Canonical",
//         offer: "UbuntuServer",
//         sku: "16.04-LTS",
//         version: "latest",
//     },
// });


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
