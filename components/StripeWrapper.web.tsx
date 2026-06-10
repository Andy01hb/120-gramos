interface Props { publishableKey: string; children: React.ReactNode }

export function StripeWrapper({ children }: Props) {
  return <>{children}</>;
}
