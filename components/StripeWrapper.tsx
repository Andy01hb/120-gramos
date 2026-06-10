import { StripeProvider } from '@stripe/stripe-react-native';

interface Props { publishableKey: string; children: React.ReactNode }

export function StripeWrapper({ publishableKey, children }: Props) {
  return <StripeProvider publishableKey={publishableKey}>{children}</StripeProvider>;
}
