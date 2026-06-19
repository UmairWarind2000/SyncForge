// src/store/hooks.ts

import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

// Use these hooks instead of plain `useDispatch` and `useSelector`
// to get proper TypeScript support
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <TSelected,>(
  selector: (state: RootState) => TSelected
) => useSelector<RootState, TSelected>(selector);
