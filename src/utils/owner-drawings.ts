// Owner drawings are money taken out by the owner. They are not an expense,
// so they never change profit; they only reduce what stays in the business.
export interface OwnerDrawing {
  id: string;
  date: string;
  amount: number;
  owner_name: string;
  payment_method?: string | null;
  notes?: string | null;
}

export const totalDrawings = (rows: Pick<OwnerDrawing, 'amount'>[]) =>
  rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

export const retainedInBusiness = (netProfit: number, drawings: number) => netProfit - drawings;
