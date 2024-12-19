<script lang="ts" setup>
import {IpcChannels} from "../constants/enum/IpcChannels";
import {ref, onBeforeMount, onMounted, reactive, computed} from "vue";
import TooltipComponent from "../components/TooltipComponent.vue";
import LoadingComponent from "../components/LoadingComponent.vue";
import { PrizeDetail, PrizeRegionDetail } from "../constants/types/PrizeDetail";
import MultiSelectComponent from "../components/MultiSelectComponent.vue";
import { CustomerTable } from "../constants/types/CustomerTable";
import { useCategory } from "../composables/useCategory";
import { Category } from "../constants/types/Category";
import { createTableName, formatNumber } from "../utils/generalUtils";

/* GET LIST OF PRIZE */
onMounted(() => {
  window.ipcRenderer.send(IpcChannels.GET_PRIZE)
})

const prizes = ref<PrizeDetail[]>([])
window.ipcRenderer.on(IpcChannels.GET_PRIZE, (event, rows) => {
  prizes.value = rows
})

/* INIT CATEGORY */
const canShowCategory = ref(true)
const { listOfCategory, getCategory } = useCategory(prizes);

/* SETTING CATEGORY PRIZE */
function handleUpdatePrize(index: number, prize: number[]) {
  listOfCategory[index].prizes = prize
}


/* SAVE CATEGORY */
const saveCategoryState = reactive({
  isLoading: false,
  isEdit: false
})

const canSaveCategory = computed(() => {
  return listOfCategory.every((category: Category) => category.prizes?.length)
})

function saveCategory() {
  /* all edited category */
  const editedCategories = listOfCategory.map((category: Category) => ({
    id: category.id,
    minBalance: category.minBalance
  }))

  /* all edited prize that is related to category */
  const editedCategoryPrizes: {prizeId: number, categoryId: number}[] = []
  listOfCategory.forEach((category: Category) => {
    category.prizes?.forEach((prizeId: number) => {
      editedCategoryPrizes.push({
        prizeId: prizeId,
        categoryId: category.id
      })
    })
  })

  window.ipcRenderer.send(
    IpcChannels.SAVE_CATEGORY,
    JSON.parse(JSON.stringify(editedCategories)),
    JSON.parse(JSON.stringify(editedCategoryPrizes))
  )

  saveCategoryState.isEdit = false
  saveCategoryState.isLoading = true
}

window.ipcRenderer.on(IpcChannels.SAVE_CATEGORY, (event, isDone) => {
  if (isDone) {
    saveCategoryState.isLoading = false
  }
  getCategory()
})

/* CHECK PATH OF URL */
const pathUrl = ref("");

const isDialogOpen = ref(false);
window.ipcRenderer.on(IpcChannels.FILE_DIALOG_CLOSED, (event) => {
  isDialogOpen.value = false;
})

function openFileDialog() {
  if (isDialogOpen.value) return;
  isDialogOpen.value = true;
  window.ipcRenderer.send(IpcChannels.OPEN_FILE_DIALOG);
}

window.ipcRenderer.on(IpcChannels.SELECTED_FILE, (event, path) => {
  if (path) {
    pathUrl.value = path;
    isDialogOpen.value = false;
    canShowCategory.value = false
  }
});

/* CHECK IS DATA EXIST */
const isCustomerDataExist = ref(false);
window.ipcRenderer.on(IpcChannels.IS_CUSTOMER_DATA_EXIST, (event, isExist) => {
  isCustomerDataExist.value = isExist;
});
onBeforeMount(() => {
  window.ipcRenderer.send(IpcChannels.IS_CUSTOMER_DATA_EXIST);
});

/* DELETE DATA */
function deleteCustomerData() {
  window.ipcRenderer.send(IpcChannels.DELETE_CUSTOMER_IN_DATABASE);
  canShowCategory.value = true
  isLoading.value = true
}

window.ipcRenderer.on(IpcChannels.DELETE_CUSTOMER_IN_DATABASE, (event) => {
  isCustomerDataExist.value = false
  isLoading.value = false
})

/* UPLOADING DATA */
const canUploadData = computed(() => {
  return listOfCategory.every((category: Category) => category.prizes?.length)
})

const insertedData = ref(0);
const isLoading = ref(false);

function generateListOfCustomerTable(): CustomerTable[] {
  const result: CustomerTable[] = []
  const setOfCustomerTable = new Set<string>()
  listOfCategory.forEach((category: Category) => {
    category.prizes?.forEach((prizeId: number) => {
      const prizeDetail: PrizeDetail | undefined = prizes.value.find((p: PrizeDetail) => p.prizeId === prizeId)

      prizeDetail?.regions.forEach((region: PrizeRegionDetail) => {
        const tableName = createTableName(category.name, region.regionName)

        if (!setOfCustomerTable.has(tableName)) {
            result.push({
            tableName: tableName.toLowerCase(),
            minBalance: category.minBalance,
            regions: region.regionName
          })
          setOfCustomerTable.add(tableName)
        }
      })
    })
  })

  return result
}

function uploadDataToDatabase() {
  isLoading.value = true;
  insertedData.value = 0;
  window.ipcRenderer.send(IpcChannels.UPLOAD_CUSTOMER_DATA_TO_DATABASE, pathUrl.value, JSON.parse(JSON.stringify(generateListOfCustomerTable())));
}

window.ipcRenderer.on(IpcChannels.UPLOAD_CUSTOMER_DATA_TO_DATABASE, (event, inserted) => {
  insertedData.value = inserted;
});

window.ipcRenderer.on(IpcChannels.UPLOAD_COMPLETE, (event, isDone) => {
  isLoading.value = !isDone;
  pathUrl.value = ''
  insertedData.value = 0
})

/* CHECK WINNER DATA EXIST */
const isWinnerDataExist = ref(false);
window.ipcRenderer.on(IpcChannels.IS_WINNER_DATA_EXIST, (event, isExist) => {
  isWinnerDataExist.value = isExist;
});
onBeforeMount(() => {
  window.ipcRenderer.send(IpcChannels.IS_WINNER_DATA_EXIST);
});

function deleteWinnerData() {
  window.ipcRenderer.send(IpcChannels.DELETE_WINNER_DATA);
  isLoading.value = true
}

window.ipcRenderer.on(IpcChannels.DELETE_WINNER_DATA, (event) => {
  isWinnerDataExist.value = false
  isLoading.value = false
})
</script>

<template>
  <div>
    <div v-if="canShowCategory && !isCustomerDataExist">
      <table class="table-1 mx-auto my-8">
        <thead>
          <tr>
            <th>Category</th>
            <th>Min. Balance</th>
            <th class="min-w-[200px]">Prize</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(category, index) in listOfCategory" :key="index">
            <td>{{ category.name }}</td>
            <td>
              <input
                v-if="saveCategoryState.isEdit"
                type="number"
                class="w-full p-2 rounded-md border"
                v-model="category.minBalance"
              >
              <p v-else>{{ formatNumber(category.minBalance) }}</p>
            </td>
            <td>
              <multi-select-component
                :isViewMode="!saveCategoryState.isEdit"
                :options="prizes.map((p: PrizeDetail) => ({id: p.prizeId, name: p.prizeName}))"
                placeholder="Select Prizes"
                :selectedOptions="category.prizes ?? []"
                @update:modelValue="handleUpdatePrize(index, $event)"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <!-- EDIT CATEGORY BUTTON -->
      <div class="flex justify-center mt-3">
        <button
          v-if="!saveCategoryState.isEdit"
          @click="saveCategoryState.isEdit = true"
          class="py-2 rounded-md px-12 button-selected"
        >
          Edit
        </button>
        <div v-else class="flex gap-3">
          <button
            class="py-2 rounded-md px-12 button-standby"
            @click="saveCategoryState.isEdit = false; getCategory()"
          >
            Cancel
          </button>
          <button
            :disabled="!canSaveCategory"
            @click="saveCategory"
            :class="{'cursor-not-allowed': !canSaveCategory, 'cursor-pointer': canSaveCategory}"
            class="py-2 rounded-md px-12 button-selected"
          >
            Save
          </button>
        </div>
      </div>
    </div>

    <div class="rounded border border-gray-400 p-4 mx-3 my-8 flex justify-center">
      <div v-if="!isLoading" class="flex flex-col gap-4">
        <TooltipComponent
          :canShow="!canUploadData"
        >
          <template v-slot:toggle>
            <button
              class="py-2 rounded-md px-4 button-selected flex mx-auto"
              @click="openFileDialog"
              :class="{'button-disabled': !canUploadData}"
              :disabled="!canUploadData"
            >
              {{ (pathUrl && isCustomerDataExist) ? "Change File" : "Select New File" }}
            </button>
          </template>
          <template v-slot:tooltipText>
            Please fill the prize for each category!
          </template>
        </TooltipComponent>


      <tooltip-component
        :canShow="pathUrl === ''"
        :tooltipTextStyle="{width: '150px', left: '125px'}"
        :tooltipTriangleStyle="{left: '75px'}"
      >
        <template v-slot:toggle>
          <button
            :class="{
                'button-standby cursor-not-allowed': !pathUrl,
                'button-selected cursor-pointer': !!pathUrl,
            }"
            :disabled="pathUrl === ''"
            class="p-2 rounded-md w-full"
            @click="uploadDataToDatabase"
          >
            Upload data to database
          </button>
        </template>
        <template v-slot:tooltipText>
          {{ isCustomerDataExist ? 'Data already exist in database!' : 'Please Upload the file first!'}}
        </template>
      </tooltip-component>

      <button
        v-if="isCustomerDataExist"
        class="py-2 rounded-md px-12 button-selected"
        @click="deleteCustomerData"
      >
        Delete Customer Data
      </button>

      <button
        v-if="isWinnerDataExist"
        class="py-2 rounded-md px-12 button-selected"
        @click="deleteWinnerData"
      >
        Delete Winner Data
      </button>
    </div>

    <div v-if="isLoading" class="flex flex-col gap-1">
      <LoadingComponent/>
      <div v-if="insertedData > 0" class="text-green-500 mt-2">
        {{ insertedData }} records inserted successfully!
      </div>
    </div>
    </div>
  </div>
</template>
