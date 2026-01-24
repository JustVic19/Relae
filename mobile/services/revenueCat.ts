import Purchases, {
    PurchasesOffering,
    PurchasesPackage,
    CustomerInfo,
    PurchasesError,
    PACKAGE_TYPE
} from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

// MOCK DATA for Expo Go
const MOCK_OFFERING: PurchasesOffering = {
    identifier: 'default',
    serverDescription: 'Default Offering',
    availablePackages: [
        {
            identifier: '$rc_monthly',
            packageType: PACKAGE_TYPE.MONTHLY,
            product: {
                identifier: 'pro_monthly',
                description: 'Pro Monthly',
                title: 'Pro Monthly',
                price: 9.99,
                priceString: '$9.99',
                currencyCode: 'USD',
            },
            offeringIdentifier: 'default',
        },
        {
            identifier: '$rc_annual',
            packageType: PACKAGE_TYPE.ANNUAL,
            product: {
                identifier: 'pro_annual',
                description: 'Pro Yearly',
                title: 'Pro Yearly',
                price: 99.99,
                priceString: '$99.99',
                currencyCode: 'USD',
            },
            offeringIdentifier: 'default',
        }
    ] as any, // casting as any because constructing full objects is verbose
    monthly: {
        identifier: '$rc_monthly',
        packageType: PACKAGE_TYPE.MONTHLY,
        product: {
            identifier: 'pro_monthly',
            description: 'Pro Monthly',
            title: 'Pro Monthly',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
        },
        offeringIdentifier: 'default',
    } as any,
    annual: {
        identifier: '$rc_annual',
        packageType: PACKAGE_TYPE.ANNUAL,
        product: {
            identifier: 'pro_annual',
            description: 'Pro Yearly',
            title: 'Pro Yearly',
            price: 99.99,
            priceString: '$99.99',
            currencyCode: 'USD',
        },
        offeringIdentifier: 'default',
    } as any,
    lifetime: null,
    weekly: null,
    twoMonth: null,
    threeMonth: null,
    sixMonth: null,
    metadata: {}
};

class RevenueCatService {
    private static instance: RevenueCatService;
    private initialized = false;
    private isMockMode = false;
    private mockProStatus = false;

    private constructor() { }

    public static getInstance(): RevenueCatService {
        if (!RevenueCatService.instance) {
            RevenueCatService.instance = new RevenueCatService();
        }
        return RevenueCatService.instance;
    }

    public async initialize(userId?: string) {
        if (this.initialized) return;

        if (!API_KEY || API_KEY === 'appl_placeholder_key') {
            console.warn('RevenueCat API Key missing or placeholder. Enabling Mock Mode.');
            this.isMockMode = true;
            this.initialized = true;
            return;
        }

        try {
            Purchases.configure({ apiKey: API_KEY });

            if (userId) {
                await Purchases.logIn(userId);
            }

            this.initialized = true;
            console.log('RevenueCat initialized successfully');
        } catch (error) {
            console.warn('Failed to initialize RevenueCat (likely Expo Go). Enabling Mock Mode.');
            this.isMockMode = true;
            this.initialized = true;
        }
    }

    public async identifyUser(userId: string) {
        if (this.isMockMode) {
            console.log('[Mock] Identifying user:', userId);
            return;
        }
        try {
            await Purchases.logIn(userId);
        } catch (error) {
            console.error('Error identifying user:', error);
        }
    }

    public async logout() {
        if (this.isMockMode) {
            console.log('[Mock] Logging out');
            this.mockProStatus = false;
            return;
        }
        try {
            await Purchases.logOut();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }

    public async getOfferings(): Promise<PurchasesOffering | null> {
        if (this.isMockMode) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));
            return MOCK_OFFERING;
        }
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                return offerings.current;
            }
        } catch (error) {
            console.error('Error fetching offerings:', error);
        }
        return null;
    }

    public async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{
        customerInfo: CustomerInfo;
        productIdentifier: string;
    } | null> {
        if (this.isMockMode) {
            console.log('[Mock] Purchase successful for:', packageToPurchase.product.identifier);
            this.mockProStatus = true;
            await new Promise(resolve => setTimeout(resolve, 1500));
            return {
                productIdentifier: packageToPurchase.product.identifier,
                customerInfo: { entitlements: { active: { pro: true } } } as any
            };
        }
        try {
            const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
            return { customerInfo, productIdentifier };
        } catch (error: any) {
            if (!error.userCancelled) {
                console.error('Error purchasing package:', error);
                throw error;
            }
        }
        return null;
    }

    public async restorePurchases(): Promise<CustomerInfo | null> {
        if (this.isMockMode) {
            console.log('[Mock] Restore successful');
            this.mockProStatus = true;
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { entitlements: { active: { pro: true } } } as any;
        }
        try {
            const customerInfo = await Purchases.restorePurchases();
            return customerInfo;
        } catch (error) {
            console.error('Error restoring purchases:', error);
            return null;
        }
    }

    public async checkProStatus(): Promise<boolean> {
        if (this.isMockMode) {
            return this.mockProStatus;
        }
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            return customerInfo.entitlements.active['pro'] !== undefined;
        } catch (error) {
            console.error('Error checking pro status:', error);
            return false;
        }
    }
}

export const revenueCatService = RevenueCatService.getInstance();
