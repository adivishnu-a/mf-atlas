declare module "xirr" {
  export interface Cashflow {
    amount: number;
    when: Date;
  }
  export default function xirr(cashflows: Cashflow[]): number;
}
