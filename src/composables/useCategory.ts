import { Ref, reactive, onMounted } from "vue";
import { IpcChannels } from "../constants/enum/IpcChannels";
import { PrizeDetail } from "../constants/types/PrizeDetail";
import { Category } from "../constants/types/Category";

export function useCategory(prizes: Ref<PrizeDetail[]>) {
  const listOfCategory = reactive<Category[]>([]);

  function getCategory() {
    window.ipcRenderer.send(IpcChannels.GET_CATEGORY_JOIN_PRIZE);
  }

  onMounted(() => {
    getCategory();
  });

  window.ipcRenderer.on(IpcChannels.GET_CATEGORY_JOIN_PRIZE, (event, rows) => {
    listOfCategory.splice(0, listOfCategory.length);
    listOfCategory.push(...rows);
  });

  return {
    listOfCategory,
    getCategory,
  };
}