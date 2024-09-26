import { Ref, reactive, onMounted } from "vue";
import { IpcChannels } from "../constants/enum/IpcChannels";
import { Prize } from "../constants/types/Prize";
import { prizeCategory } from "../constants/data/prizeCategory";
import { Category } from "../constants/types/Category";

export function useCategory(prizes: Ref<Prize[]>) {
  const listOfCategory = reactive<Category[]>([]);

  function getCategory() {
    window.ipcRenderer.send(IpcChannels.GET_CATEGORY);
  }

  onMounted(() => {
    getCategory();
  });

  window.ipcRenderer.on(IpcChannels.GET_CATEGORY, (event, rows) => {
    if (rows.length > 0) {
      listOfCategory.splice(0, listOfCategory.length);

      rows.forEach((row: any) => {
        listOfCategory.push({
          id: row.id,
          name: row.name,
          minBalance: row.min_balance,
          prize: JSON.parse(row.prize).filter((prize: number) =>
            prizes.value.some((p: Prize) => p.id === prize)
          ),
        });
      });
    } else {
      prizeCategory.forEach((prize, index) => {
        listOfCategory.push({
          id: index+1,
          name: prize.text,
          minBalance: 0,
          prize: null,
        });
      });
    }
  });

  return {
    listOfCategory,
    getCategory,
  };
}