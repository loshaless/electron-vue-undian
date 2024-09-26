<script lang="ts" setup>
import {IpcChannels} from "../constants/enum/IpcChannels";
import {ref, onBeforeMount, onMounted, reactive, computed} from "vue";
import TooltipComponent from "../components/TooltipComponent.vue";
import LoadingComponent from "../components/LoadingComponent.vue";
import { Prize } from "../constants/types/Prize";
import MultiSelectComponent from "../components/MultiSelectComponent.vue";
import { Quota } from "../constants/types/Quota";
import { CustomerTable } from "../constants/types/CustomerTable";
import { useCategory } from "../composables/useCategory";
import { Category } from "../constants/types/Category";
import { replaceSpaceWithUnderscore } from "../utils/generalUtils";
import { formatNumber } from "../utils/generalUtils";

/* GET LIST OF PRIZE */
onMounted(() => {
  window.ipcRenderer.send(IpcChannels.GET_PRIZE)
})

const prizes = ref<Prize[]>([])
window.ipcRenderer.on(IpcChannels.GET_PRIZE, (event, rows) => {
  if (rows) {
    prizes.value = rows.map((row: any) => {
      return {
        id: row.id,
        name: row.name,
        detail: JSON.parse(row.detail)
      }
    })
  }
})

/* INIT CATEGORY */
const canShowCategory = ref(true)
const { listOfCategory, getCategory } = useCategory(prizes);

/* SETTING CATEGORY PRIZE */
function handleUpdatePrize(index: number, prize: number[]) {
  listOfCategory[index].prize = prize
}

/* SAVE CATEGORY */
const saveCategoryState = reactive({
  isLoading: false,
  isEdit: false
})

const canSaveCategory = computed(() => {
  return listOfCategory.every((category: Category) => category.prize?.length)
})
function saveCategory() {
  window.ipcRenderer.send(
    IpcChannels.SAVE_CATEGORY, 
    JSON.parse(JSON.stringify(listOfCategory))
  )
  
  saveCategoryState.isEdit = false
  saveCategoryState.isLoading = true
}

window.ipcRenderer.on(IpcChannels.SAVE_CATEGORY, (event, isDone) => {
  if (isDone) {
    saveCategoryState.isLoading = false
  }
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
const isDataExist = ref(false);
window.ipcRenderer.on(IpcChannels.IS_CUSTOMER_DATA_EXIST, (event, isExist) => {
  isDataExist.value = isExist;
});
onBeforeMount(() => {
  window.ipcRenderer.send(IpcChannels.IS_CUSTOMER_DATA_EXIST);
});

/* DELETE DATA */
function deleteData() {
  window.ipcRenderer.send(IpcChannels.DELETE_CUSTOMER_IN_DATABASE);
  canShowCategory.value = true
}

/* UPLOADING DATA */
const insertedData = ref(0);
const isLoading = ref(false);

function generateListOfCustomerTable(): CustomerTable[] {
  const result: CustomerTable[] = []
  listOfCategory.forEach((category: Category) => {
    category.prize?.forEach((prizeId: number) => {
      const prizeDetail = prizes.value.find((p: Prize) => p.id === prizeId)

      prizeDetail?.detail.forEach((quota: Quota) => {
        const tableName = `customer_${replaceSpaceWithUnderscore(category.name)}_${replaceSpaceWithUnderscore(quota.name.join('_'))}`
      
        result.push({
          tableName: tableName,
          minBalance: category.minBalance,
          regions: quota.name
        })
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
})
</script>

<template>
  <div>
    <div 
      v-if="canShowCategory && !isDataExist"
      class="rounded border border-gray-400 p-4 m-3"
    >
      <table class="table-auto w-full border-white text-center">
        <thead>
          <tr>
            <th class="px-4 py-2 border">Category</th>
            <th class="px-4 py-2 border">Min. Balance</th>
            <th class="px-4 py-2 border">Prize</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(category, index) in listOfCategory" :key="index">
            <td class="border px-4 py-2">{{ category.name }}</td>
            <td class="border px-4 py-2">
              <input 
                v-if="saveCategoryState.isEdit"
                type="number" 
                class="w-full p-2 rounded-md border"
                v-model="category.minBalance"
              >
              <p v-else>{{ formatNumber(category.minBalance) }}</p>
            </td>
            <td class="border px-4 py-2">
              <multi-select-component
                :isViewMode="!saveCategoryState.isEdit"
                :options="prizes"
                placeholder="Select Prizes"
                :selectedOptions="category.prize ?? []"  
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
          class="bg-green-500 text-white py-2 rounded-md px-12 hover:bg-green-600 hover:scale-105"
        >
          Edit
        </button>
        <div v-else class="flex gap-3">
          <button
            class="bg-red-500 text-white py-2 rounded-md px-12 hover:bg-red-600 hover:scale-105"
            @click="saveCategoryState.isEdit = false; getCategory()"
          >
            Cancel
          </button>
          <button
            :disabled="!canSaveCategory"
            @click="saveCategory"
            :class="{'cursor-not-allowed': !canSaveCategory, 'cursor-pointer': canSaveCategory}"
            class="bg-green-500 text-white py-2 rounded-md px-12 hover:bg-green-600 hover:scale-105"
          >
            Save
          </button>
        </div>
      </div>
    </div>

    <div class="rounded border border-gray-400 p-4 mx-3 my-8 flex justify-center">
      <div v-if="!isLoading" class="flex flex-col gap-4">
      <button
        class="bg-blue-500 text-white py-2 rounded-md px-4 hover:bg-blue-600 hover:scale-105"
        @click="openFileDialog"
      >
        {{ (pathUrl && isDataExist) ? "Change File" : "Select New File" }}
      </button>

      <tooltip-component
        :canShow="pathUrl === ''"
        :tooltipTextStyle="{width: '150px', left: '125px'}"
        :tooltipTriangleStyle="{left: '75px'}"
      >
        <template v-slot:toggle>
          <button
            :class="{
                'bg-gray-500 cursor-not-allowed': !pathUrl,
                'bg-blue-500 cursor-pointer': !!pathUrl,
            }"
            :disabled="pathUrl === ''"
            class="text-white p-2 rounded-md w-full"
            @click="uploadDataToDatabase"
          >
            Upload data to database
          </button>
        </template>
        <template v-slot:tooltipText>
          {{ isDataExist ? 'Data already exist in database!' : 'Please Upload the file first!'}}
        </template>
      </tooltip-component>

      <button
        v-if="isDataExist"
        class="text-white bg-red-700 p-2 rounded-md"
        @click="deleteData"
      >
        Delete Data
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
