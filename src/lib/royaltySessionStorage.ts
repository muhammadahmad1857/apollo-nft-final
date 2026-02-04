
const BATCH_MINT_ROYALTY_KEY = "BATCH_MINT_ROYALTY";
const SINGLE_MINT_ROYALTY_KEY = "SINGLE_MINT_ROYALTY";

export const saveRoyalty = (value: number, type: "BATCH" | "SINGLE" = "BATCH") => {
  const key = type === "BATCH" ? BATCH_MINT_ROYALTY_KEY : SINGLE_MINT_ROYALTY_KEY;
  try {
    sessionStorage.setItem(key, value.toString());
  } catch (err) {
    console.error("Failed to save royalty in sessionStorage:", err);
  }
};

export const getRoyalty = (type: "BATCH" | "SINGLE" = "BATCH"): number | null => {
  const key = type === "BATCH" ? BATCH_MINT_ROYALTY_KEY : SINGLE_MINT_ROYALTY_KEY;
  const val = sessionStorage.getItem(key);
  return val ? Number(val) : null;
};

export const removeRoyalty = (type: "BATCH" | "SINGLE" = "BATCH") => {
  const key = type === "BATCH" ? BATCH_MINT_ROYALTY_KEY : SINGLE_MINT_ROYALTY_KEY;
  sessionStorage.removeItem(key);
};
