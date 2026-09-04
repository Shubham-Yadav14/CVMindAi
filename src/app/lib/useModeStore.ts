import { create } from "zustand";
import { persist } from "zustand/middleware";

type ModeStore = {
  lightMode: boolean;
  toggleMode: () => void;
};

const useModeStore = create<ModeStore>()(
  persist(
    (set) => ({
      lightMode: true,
      toggleMode: () =>
        set((state) => {
          return { lightMode: !state.lightMode };
        }),
    }),
    {
      name: "theme_storage",
      partialize: (state) => ({ lightMode: state.lightMode }),
    },
  ),
);


export default useModeStore;
