<script lang="ts" setup>
import {onMounted, reactive, ref} from "vue";
import SelectComponent from "../components/SelectComponent.vue";
import ModalComponent from "../components/ModalComponent.vue";
import {IpcChannels} from "../constants/enum/IpcChannels";
import { Quota } from "../constants/types/Quota";
import { Prize } from "../constants/types/Prize";

const isLoadingInAction = ref(false)

/* GET REGION DATA */
interface Region {
  id: number
  name: string
}
const regions = ref<Region[]>([])
window.ipcRenderer.on(IpcChannels.GET_REGION_DATA, (event, rows) => {
  if (rows) {
    regions.value = rows
  }
})

function deleteRegion(id: number) {
  regions.value = regions.value.filter((region) => region.id !== id)
}

function getRegion() {
  window.ipcRenderer.send(IpcChannels.GET_REGION_DATA)
}

onMounted(() => {
  getRegion()
})

/* MODAL PRIZE */
const modalPrizeState = reactive({
  isOpen: false,
  isLoading: false,
  name: "",
  quotas: [] as Quota[]
})

function openModalCreatePrize(isOpen: boolean) {
  modalPrizeState.isOpen = isOpen
  modalPrizeState.name = ""
  editedPrizeId.value = 0
  modalPrizeState.quotas = []
}

function openModalEditPrize(prize: Prize) {
  modalPrizeState.isOpen = true
  modalPrizeState.name = prize.name
  editedPrizeId.value = prize.id
  modalPrizeState.quotas = JSON.parse(JSON.stringify(prize.detail))
  
}

/* MODAL REGION */
const modalRegionState = reactive({
  isOpen: false,
  isLoading: false,
  isEdit: false
})


/* ADD PRIZE FOR CERTAIN REGION */
function addRow() {
  modalPrizeState.quotas.push({
    id: regions.value[0].id,
    name: regions.value[0].name,
    numOfItem: 1
  },)
}

function saveNewPrize() {
  modalPrizeState.isLoading = true
  window.ipcRenderer.send(IpcChannels.ADD_PRIZE, {
    name: modalPrizeState.name,
    detail: JSON.stringify(modalPrizeState.quotas)
  })
}

window.ipcRenderer.on(IpcChannels.ADD_PRIZE, (event) => {
  modalPrizeState.isLoading = false
  modalPrizeState.isOpen = false
  getPrize()
})

/* GET PRIZE DATA */
function getPrize() {
  window.ipcRenderer.send(IpcChannels.GET_PRIZE)
}

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

    isLoadingInAction.value = false
  }
})

onMounted(() => {
  getPrize()
})

/* EDIT PRIZE */
const editedPrizeId = ref(0)

function saveEditedPrize() {
  modalPrizeState.isLoading = true
  isLoadingInAction.value = true

  window.ipcRenderer.send(IpcChannels.EDIT_PRIZE, {
    id: editedPrizeId.value,
    name: modalPrizeState.name,
    detail: JSON.stringify(modalPrizeState.quotas)
  })
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
  getPrize()
})
</script>

<template>
  <div>
    <div class="border-gray-800 rounded-md bg-black p-5 my-5 mx-5 flex-col justify-center">
      <div class="flex gap-4 items-center justify-center">
        <button
          class="rounded-md bg-green-700 text-white hover:bg-amber-500 cursor-pointer py-3 px-8"
          @click="openModalCreatePrize(true)"
        >
          Create New Prize
        </button>
        <button
          class="rounded-md bg-green-700 text-white hover:bg-amber-500 cursor-pointer py-3 px-8"
          @click="modalRegionState.isOpen = true"
        >
          Edit Region
        </button>
      </div>

      <!-- Table to display prizes -->
      <div class="mt-5">
        <table class="table-auto w-full text-white border-white">
          <thead>
          <tr>
            <th class="px-4 py-2 border">ID</th>
            <th class="px-4 py-2 border">Name</th>
            <th class="px-4 py-2 border">Quota</th>
            <th class="px-4 py-2 border">Action</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="prize in prizes" :key="prize.id" class="text-center">
            <td class="border px-4 py-2">{{ prize.id }}</td>
            <td class="border px-4 py-2">{{ prize.name }}</td>
            <td class="border px-4 py-2">
              <ul>
                <li v-for="(quota, index) in prize.detail" :key="index">
                  {{ quota.name }}: {{ quota.numOfItem }}
                </li>
              </ul>
            </td>
            <td class="border px-4 py-2">
              <div
                v-if="!isLoadingInAction"
                class="flex gap-2 justify-center items-center"
              >
                <button
                  class="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
                  @click="openModalEditPrize(prize)"
                >
                  Edit
                </button>
                <button
                  class="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded ml-2"
                  @click="deletePrize(prize.id)"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <modal-component
      :is-loading="modalPrizeState.isLoading"
      :is-open="modalPrizeState.isOpen"
      @update:isOpen="modalPrizeState.isOpen = $event"
    >
      <div>
        <label>Prize Name : </label>
        <input
          v-model="modalPrizeState.name"
          class="border-gray-300 rounded p-2 border"
          placeholder="prize name"
          type="text"
        >
      </div>
      <div>
        <div class="mt-3 flex items-center gap-3">
          <p>Quota Detail : </p>
          <button
            class="p-3 bg-orange-500 rounded-md hover:bg-orange-300"
            @click="addRow()"
          >
            Add Row
          </button>
        </div>

        <div
          v-for="(item, index) in modalPrizeState.quotas"
          :key="index"
          class="flex gap-3 items-center mt-3"
        >
          <select-component
            :options="regions"
            :model-value="item.id"
            @update:modelValue="item.id = $event;"
            @update:selectedName="item.name = $event;"
          />
          <input
            v-model="item.numOfItem"
            class="border-gray-300 rounded p-2 border"
            placeholder="total pemenang"
            type="text"
          >
          <span
            v-if="modalPrizeState.quotas.length > 1"
            class="rounded-full bg-red-700 hover:bg-orange-700 cursor-pointer px-3 py-1 text-white hover:scale-110"
            @click="modalPrizeState.quotas.splice(index, 1)"
          >
            X
          </span>
        </div>
      </div>

      <div class="flex justify-center mt-8">
        <button
          class="rounded-md bg-green-700 text-white hover:bg-amber-500 cursor-pointer py-3 px-8 w-3/4"
          @click="editedPrizeId ? saveEditedPrize() : saveNewPrize()"
        >
          {{ editedPrizeId ? `Edit Prize Id: ${editedPrizeId}` : 'Create New Prize' }}
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
            <tr v-for="region in regions" :key="region.id">
              <td class="border px-4 py-2 border-gray-800">{{ region.id }}</td>
              <td class="border px-4 py-2 border-gray-800">
                <div v-if="modalRegionState.isEdit" class="flex gap-3 items-center">
                  <input
                    v-model="region.name"
                    class="border-gray-300 rounded p-2 border"
                    placeholder="prize name"
                    type="text"
                  >
                  <div
                    class="rounded-full bg-red-700 hover:bg-orange-700 cursor-pointer h-full px-2 text-white hover:scale-110"
                    @click="deleteRegion(region.id)"
                  >
                    X
                  </div>
                </div>

                <p v-else>
                  {{ region.name }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
        <button
          class="mt-3 w-full rounded-md bg-green-700 text-white hover:bg-amber-500 cursor-pointer py-3 px-8 w-3/4"
          @click="modalRegionState.isEdit = !modalRegionState.isEdit"
        >
          {{ modalRegionState.isEdit ? 'Save' : 'Edit' }}
        </button>
      </div>
    </modal-component>
  </div>
</template>
