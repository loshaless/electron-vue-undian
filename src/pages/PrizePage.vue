<script lang="ts" setup>
import {onMounted, reactive, ref} from "vue";
import SelectComponent from "../components/SelectComponent.vue";
import ModalComponent from "../components/ModalComponent.vue";
import {IpcChannels} from "../constants/enum/IpcChannels";
import { PrizeDetail } from "../constants/types/PrizeDetail";
import { Region } from "../constants/types/Region";

const isLoadingInAction = ref(false)

/* GET REGION DATA */
const regions = ref<Region[]>([])
window.ipcRenderer.on(IpcChannels.GET_REGION_DATA, (_, rows) => {
  if (rows) {
    regions.value = rows
  }
})

function deleteRegion(regionId: number) {
  modalRegionState.editedRegion.splice(modalRegionState.editedRegion.findIndex(region => region.id === regionId), 1)
  modalRegionState.deleteRegion.push(regionId)
}

function addRegion() {
  modalRegionState.addedRegion.push("")
}

function saveEditedRegion() {
  modalRegionState.isLoading = true
  window.ipcRenderer.send(IpcChannels.MASS_EDIT_REGION,
    JSON.parse(JSON.stringify(modalRegionState.editedRegion)),
    JSON.parse(JSON.stringify(modalRegionState.addedRegion)),
    JSON.parse(JSON.stringify(modalRegionState.deleteRegion))
  )
}

window.ipcRenderer.on(IpcChannels.MASS_EDIT_REGION, () => {
  modalRegionState.isLoading = false
  modalRegionState.isOpen = false
  window.location.reload()
})

function getRegion() {
  window.ipcRenderer.send(IpcChannels.GET_REGION_DATA)
}

onMounted(() => {
  getRegion()
})

/* MODAL REGION */
const modalRegionState = reactive({
  isOpen: false,
  isLoading: false,
  isEdit: false,
  editedRegion: [] as Region[],
  addedRegion: [] as string[],
  deleteRegion: [] as number[]
})

function openModalEditRegion() {
  modalRegionState.editedRegion = JSON.parse(JSON.stringify(regions.value))
  modalRegionState.addedRegion = []
  modalRegionState.deleteRegion = []
  modalRegionState.isOpen = true
}

/* MODAL PRIZE */
const modalPrizeState = reactive({
  isOpen: false,
  isLoading: false,
  prizeDetail: {} as PrizeDetail,
  editedPrizeRegion: [] as any[],
  addedPrizeRegion: [] as any[],
  deletePrizeRegion: [] as number[]
})

function openModalCreatePrize(isOpen: boolean) {
  modalPrizeState.isOpen = isOpen
  modalPrizeState.prizeDetail = {
    prizeId: 0,
    prizeName: "",
    prizeImagePath: "",
    regions: []
  }
  modalPrizeState.editedPrizeRegion = []
  editedPrizeId.value = 0
  modalPrizeState.addedPrizeRegion = []
}

function openModalEditPrize(prize: PrizeDetail) {
  modalPrizeState.isOpen = true
  modalPrizeState.prizeDetail = JSON.parse(JSON.stringify(prize))
  editedPrizeId.value = prize.prizeId
  modalPrizeState.editedPrizeRegion = JSON.parse(JSON.stringify(prize.regions))
  modalPrizeState.addedPrizeRegion = []
  modalPrizeState.deletePrizeRegion = []
}

/* ADD PRIZE FOR CERTAIN REGION */
function addRegionForPrize() {
  modalPrizeState.addedPrizeRegion.push({
    prizeRegionId: 0,
    regionId: regions.value[0].id,
    regionName: regions.value[0].name,
    numOfItem: 1
  },)
}

function saveNewPrize() {
  modalPrizeState.isLoading = true
  window.ipcRenderer.send(IpcChannels.ADD_PRIZE,
    JSON.parse(JSON.stringify(modalPrizeState.prizeDetail)),
    JSON.parse(JSON.stringify(modalPrizeState.addedPrizeRegion)),
  )
}

window.ipcRenderer.on(IpcChannels.ADD_PRIZE, (_) => {
  modalPrizeState.isLoading = false
  modalPrizeState.isOpen = false
  getPrize()
})

/* GET PRIZE DATA */
function getPrize() {
  window.ipcRenderer.send(IpcChannels.GET_PRIZE)
}

const prizes = ref<PrizeDetail[]>([])
window.ipcRenderer.on(IpcChannels.GET_PRIZE, (_, rows) => {
  prizes.value = rows
})

onMounted(() => {
  getPrize()
})

/* EDIT PRIZE */
const editedPrizeId = ref(0)

function saveEditedPrize() {
  modalPrizeState.isLoading = true

  window.ipcRenderer.send(IpcChannels.EDIT_PRIZE,
    JSON.parse(JSON.stringify(modalPrizeState.prizeDetail)),
    JSON.parse(JSON.stringify(modalPrizeState.editedPrizeRegion)),
    JSON.parse(JSON.stringify(modalPrizeState.addedPrizeRegion)),
    JSON.parse(JSON.stringify(modalPrizeState.deletePrizeRegion))
  )
}

window.ipcRenderer.on(IpcChannels.EDIT_PRIZE, () => {
  modalPrizeState.isLoading = false
  modalPrizeState.isOpen = false
  getPrize()
})

/* DELETE PRIZE */
function deletePrize(id: number) {
  isLoadingInAction.value = true
  window.ipcRenderer.send(IpcChannels.DELETE_PRIZE, id)
}

window.ipcRenderer.on(IpcChannels.DELETE_PRIZE, () => {
  isLoadingInAction.value = false
  getPrize()
})

/* UPLOAD PRIZE BACKGROUND */
const prizeBackgroundId = ref(0)
function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;

  if (input.files?.[0]) {
    const file = input.files[0]
    const reader = new FileReader();
    reader.onload = (_) => {
      window.ipcRenderer.send(IpcChannels.UPLOAD_PRIZE_BACKGROUND_IMAGE, reader.result, prizeBackgroundId.value)
      const changesPrize = prizes.value.find(prize => prize.prizeId === prizeBackgroundId.value) ?? {prizeImagePath: ''}
      changesPrize.prizeImagePath = reader.result as string
    };
    reader.readAsDataURL(file);
  }
}

/* CHECK IS CUSTOMER DATA EXIST */
const isCustomerDataExist = ref(false);
window.ipcRenderer.on(IpcChannels.IS_CUSTOMER_DATA_EXIST, (_, isExist) => {
  isCustomerDataExist.value = isExist;
});
onMounted(() => {
  window.ipcRenderer.send(IpcChannels.IS_CUSTOMER_DATA_EXIST);
});

</script>

<template>
  <div>
    <div class="p-5 m-3 flex-col justify-center">
      <div class="flex gap-4 items-center justify-center">
        <button
          v-if="!isCustomerDataExist"
          class="rounded-md button-selected py-3 px-8"
          @click="openModalCreatePrize(true)"
        >
          Create New Prize
        </button>
        <button
          v-if="!isCustomerDataExist"
          class="rounded-md button-selected py-3 px-8"
          @click="openModalEditRegion()"
        >
          Edit Region
        </button>
      </div>
    </div>

    <!-- Table to display prizes -->
    <div class="flex justify-center">
      <table class="table-1">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Quota</th>
          <th>Action</th>
          <th>Background Img</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(prize, index) in prizes"
          :key="prize.prizeId"
        >
          <td>{{ index + 1 }}</td>
          <td>{{ prize.prizeName }}</td>
          <td>
            <ul>
              <li v-for="(quota, index) in prize.regions" :key="index">
                {{ quota.regionName }}: {{ quota.numOfItem }}
              </li>
            </ul>
          </td>
          <td>
            <div
              v-if="!isLoadingInAction"
              class="flex gap-2 justify-center items-center"
            >
              <img
                src="/icon-cog.svg"
                alt="edit"
                class="w-6 h-6 cursor-pointer hover:scale-110"
                @click="openModalEditPrize(prize)"
              >
              <img
                v-if="!isCustomerDataExist"
                src="/icon-trash-can.svg"
                alt="delete"
                class="w-6 h-6 cursor-pointer hover:scale-110"
                @click="deletePrize(prize.prizeId)"
              >
            </div>
          </td>
          <td>
            <label
              for="file-upload"
              @click="prizeBackgroundId = prize.prizeId"
            >
              <img
                v-if="!prize.prizeImagePath"
                src="/icon-upload.png"
                alt="upload"
                class="w-6 h-6 cursor-pointer hover:scale-110 mx-auto"
              >
              <img
                v-else
                :src="prize.prizeImagePath"
                alt="upload"
                class="w-52 h-32 cursor-pointer hover:scale-110 mx-auto"
              >
            </label>
            <input
              id="file-upload"
              type="file"
              @change="handleFileUpload"
              accept="image/*"
              class="hidden"
            />
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <modal-component
      :is-loading="modalPrizeState.isLoading"
      :is-open="modalPrizeState.isOpen"
      @update:isOpen="modalPrizeState.isOpen = $event"
    >
      <div>
        <label>Prize Name : </label>
        <input
          v-model="modalPrizeState.prizeDetail.prizeName"
          class="border-gray-300 rounded p-2 border"
          placeholder="prize name"
          type="text"
        >
      </div>
      <div>
        <div class="mt-3 flex items-center gap-3">
          <p>Quota Detail : </p>
          <button
            class="p-2 rounded-md button-selected"
            @click="addRegionForPrize()"
          >
            Add More Region
          </button>
        </div>

        <!-- EDITED PRIZE REGION -->
        <div
          v-for="(item, index) in modalPrizeState.editedPrizeRegion"
          :key="index"
          class="flex gap-3 items-center mt-3"
        >
          <select-component
            :options="regions"
            :model-value="item.regionId"
            @update:modelValue="item.regionId = $event;"
            @update:selectedName="item.regionName = $event;"
          />
          <input
            v-model="item.numOfItem"
            class="border-gray-300 rounded p-2 border"
            placeholder="total pemenang"
            min="1"
            type="number"
          >
          <img
            src="/icon-trash-can.svg"
            alt="delete"
            class="w-6 h-6 cursor-pointer hover:scale-110"
            @click="modalPrizeState.editedPrizeRegion.splice(index, 1); modalPrizeState.deletePrizeRegion.push(item.prizeRegionId)"
          >
        </div>

        <!-- ADDED PRIZE REGION -->
        <div
          v-for="(item, index) in modalPrizeState.addedPrizeRegion"
          :key="index"
          class="flex gap-3 items-center mt-3"
        >
          <select-component
            :options="regions"
            :model-value="item.regionId"
            @update:modelValue="item.regionId = $event;"
            @update:selectedName="item.regionName = $event;"
          />
          <input
            v-model="item.numOfItem"
            class="border-gray-300 rounded p-2 border"
            placeholder="total pemenang"
            type="number"
            min="1"
          >
          <img
            src="/icon-trash-can.svg"
            alt="delete"
            class="w-6 h-6 cursor-pointer hover:scale-110"
            @click="modalPrizeState.addedPrizeRegion.splice(index, 1)"
          >
        </div>
      </div>

      <div class="flex justify-center mt-8">
        <button
          v-if="modalPrizeState.addedPrizeRegion.length > 0 || modalPrizeState.editedPrizeRegion.length > 0"
          class="rounded-md button-selected py-2 px-8 w-3/4"
          :class="{'button-disabled': modalPrizeState.prizeDetail.prizeName === ''}"
          :disabled="modalPrizeState.prizeDetail.prizeName === ''"
          @click="editedPrizeId ? saveEditedPrize() : saveNewPrize()"
        >
          {{ editedPrizeId ? `Edit Prize Id: ${editedPrizeId}` : 'Save New Prize' }}
        </button>
      </div>
    </modal-component>

    <modal-component
      :is-loading="modalRegionState.isLoading"
      :is-open="modalRegionState.isOpen"
      @update:isOpen="modalRegionState.isOpen = $event"
    >
      <div>
        <table class="table-auto w-full border-white text-center">
          <thead>
            <tr>
              <th class="px-4 py-2 border border-gray-800">ID</th>
              <th class="px-4 py-2 border border-gray-800">Name</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(region, index) in modalRegionState.editedRegion" :key="region.id">
              <td class="border px-4 py-2 border-gray-800">{{ region.id }}</td>
              <td class="border px-4 py-2 border-gray-800">
                <div
                  v-if="modalRegionState.isEdit && region.name !== 'All Region'"
                  class="flex gap-3 items-center"
                >
                  <input
                    v-model="region.name"
                    class="border-gray-300 rounded p-2 border"
                    placeholder="prize name"
                    type="text"
                  >
                  <img
                    src="/icon-trash-can.svg"
                    alt="delete"
                    class="w-6 h-6 cursor-pointer hover:scale-110"
                    @click="deleteRegion(region.id)"
                  >
                </div>

                <p v-else>
                  {{ region.name }}
                </p>
              </td>
            </tr>
            <tr v-for="(region, index) in modalRegionState.addedRegion" :key="index">
              <td class="border px-4 py-2 border-gray-800">{{ modalRegionState.editedRegion.length + index + 1 }}</td>
              <td class="border px-4 py-2 border-gray-800">
                <div class="flex gap-3 items-center">
                  <input
                    v-model="modalRegionState.addedRegion[index]"
                    class="border-gray-300 rounded p-2 border"
                    placeholder="prize name"
                    type="text"
                  >
                  <img
                    src="/icon-trash-can.svg"
                    alt="delete"
                    class="w-6 h-6 cursor-pointer hover:scale-110"
                    @click="modalRegionState.addedRegion.splice(index, 1)"
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="flex justify-center gap-3">
          <button
            v-if="!modalRegionState.isEdit"
            class="mt-3 rounded-md button-selected py-2 px-8"
            @click="modalRegionState.isEdit = !modalRegionState.isEdit"
          >
            Edit
          </button>
          <button
            v-if="modalRegionState.isEdit"
            class="mt-3 rounded-md button-selected py-2 px-8"
            @click="saveEditedRegion()"
          >
            Save
          </button>
          <button
            v-if="modalRegionState.isEdit"
            class="mt-3 rounded-md button-selected py-2 px-8"
            @click="addRegion()"
          >
            Add Region
          </button>
        </div>
      </div>
    </modal-component>
  </div>
</template>
