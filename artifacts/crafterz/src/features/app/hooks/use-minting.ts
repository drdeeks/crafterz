import { useState, useRef, useCallback } from 'react';
import type { AppMintPhase } from '../app-types';

export interface MintModal {
  uid: string;
  name: string;
  emojis: [string, string?];
  tier: string;
  phase: AppMintPhase;
}

export interface UseMintingReturn {
  mintModal: MintModal | null;
  setMintModal: React.Dispatch<React.SetStateAction<MintModal | null>>;
  mintModalRef: React.MutableRefObject<MintModal | null>;
  mintingPaused: boolean;
  setMintingPaused: React.Dispatch<React.SetStateAction<boolean>>;
  showMintPriceInput: boolean;
  mintPriceDraft: string;
  openMintPriceInput: () => void;
  changeMintPriceDraft: (value: string) => void;
  cancelMintPriceInput: () => void;
  toggleMintingPause: () => void;
}

export function useMinting(defaultMintPrice: number): UseMintingReturn {
  const [mintModal, setMintModal] = useState<MintModal | null>(null);
  const mintModalRef = useRef<MintModal | null>(null);
  mintModalRef.current = mintModal;

  const [mintingPaused, setMintingPaused] = useState(false);
  const [showMintPriceInput, setShowMintPriceInput] = useState(false);
  const [mintPriceDraft, setMintPriceDraft] = useState(String(defaultMintPrice));

  const toggleMintingPause = useCallback(() => {
    setMintingPaused((prev) => !prev);
  }, []);

  const openMintPriceInput = useCallback(() => {
    setShowMintPriceInput(true);
    setMintPriceDraft(String(defaultMintPrice));
  }, [defaultMintPrice]);

  const changeMintPriceDraft = useCallback((value: string) => {
    setMintPriceDraft(value);
  }, []);

  const cancelMintPriceInput = useCallback(() => {
    setShowMintPriceInput(false);
  }, []);

  return {
    mintModal, setMintModal, mintModalRef,
    mintingPaused, setMintingPaused,
    showMintPriceInput,
    mintPriceDraft,
    openMintPriceInput,
    changeMintPriceDraft,
    cancelMintPriceInput,
    toggleMintingPause,
  };
}
