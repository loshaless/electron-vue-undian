<script lang="ts" setup>
import {onMounted, ref} from "vue";
import MultiSelectComponent from "../components/MultiSelectComponent.vue";
import ModalComponent from "../components/ModalComponent.vue";
import {IpcChannels} from "../constants/IpcChannels";
import SwitchComponent from "../components/SwitchComponent.vue";

const isLoadingInAction = ref(false)

interface Quota {
  value: string[];
  text: string[];
  numOfItem: number;
}

/* MODAL */
const isModalOpen = ref(false)
const isLoadingInModal = ref(false)

function handleModalOpen(isOpen: boolean) {
  getPrize()
  
  if (!isOpen) {
    quotas.value = []
    prizeName.value = ''
    editedPrizeId.value = 0
  }
  isModalOpen.value = isOpen
}

/* ADD PRIZE */
const prizeName = ref("");
const isAllRegion = ref(true)
const allRegionQuota = ref(1)
const quotas = ref<Quota[]>([]);
const provinces = [
  {
    id: 'Aceh',
    name: 'Aceh'
  },
  {
    id: 'Sumatera Utara',
    name: 'Sumatera Utara'
  },
  {
    id: 'Sumatera Barat',
    name: 'Sumatera Barat'
  },
  {
    id: 'Riau',
    name: 'Riau'
  },
  {
    id: 'Jambi',
    name: 'Jambi'
  },
  {
    id: 'Sumatera Selatan',
    name: 'Sumatera Selatan'
  },
  {
    id: 'Bengkulu',
    name: 'Bengkulu'
  },
  {
    id: 'Lampung',
    name: 'Lampung'
  },
  {
    id: 'Kepulauan Bangka Belitung',
    name: 'Kepulauan Bangka Belitung'
  },
  {
    id: 'Kepulauan Riau',
    name: 'Kepulauan Riau'
  },
  {
    id: 'DKI Jakarta',
    name: 'DKI Jakarta'
  },
  {
    id: 'Jawa Barat',
    name: 'Jawa Barat'
  },
  {
    id: 'Jawa Tengah',
    name: 'Jawa Tengah'
  },
  {
    id: 'DI Yogyakarta',
    name: 'DI Yogyakarta'
  },
  {
    id: 'Jawa Timur',
    name: 'Jawa Timur'
  },
  {
    id: 'Banten',
    name: 'Banten'
  },
  {
    id: 'Bali',
    name: 'Bali'
  },
  {
    id: 'Nusa Tenggara Barat',
    name: 'Nusa Tenggara Barat'
  },
  {
    id: 'Nusa Tenggara Timur',
    name: 'Nusa Tenggara Timur'
  },
  {
    id: 'Kalimantan Barat',
    name: 'Kalimantan Barat'
  },
  {
    id: 'Kalimantan Tengah',
    name: 'Kalimantan Tengah'
  },
  {
    id: 'Kalimantan Selatan',
    name: 'Kalimantan Selatan'
  },
  {
    id: 'Kalimantan Timur',
    name: 'Kalimantan Timur'
  },
  {
    id: 'Kalimantan Utara',
    name: 'Kalimantan Utara'
  },
  {
    id: 'Sulawesi Utara',
    name: 'Sulawesi Utara'
  },
  {
    id: 'Sulawesi Tengah',
    name: 'Sulawesi Tengah'
  },
  {
    id: 'Sulawesi Selatan',
    name: 'Sulawesi Selatan'
  },
  {
    id: 'Sulawesi Tenggara',
    name: 'Sulawesi Tenggara'
  },
  {
    id: 'Gorontalo',
    name: 'Gorontalo'
  },
  {
    id: 'Sulawesi Barat',
    name: 'Sulawesi Barat'
  },
  {
    id: 'Maluku',
    name: 'Maluku'
  },
  {
    id: 'Maluku Utara',
    name: 'Maluku Utara'
  },
  {
    id: 'Papua',
    name: 'Papua'
  },
  {
    id: 'Papua Barat',
    name: 'Papua Barat'
  }
]

function addRow() {
  quotas.value.push({
    value: ['DKI Jakarta'],
    text: ['DKI Jakarta'],
    numOfItem: 1
  },)
}

function saveNewPrize() {
  isLoadingInModal.value = true

  if (isAllRegion.value) {
    quotas.value = [
      {
        value: ['All Region'],
        text: ['All Region'],
        numOfItem: allRegionQuota.value
      }
    ]
  }

  window.ipcRenderer.send(IpcChannels.ADD_PRIZE, {
    name: prizeName.value,
    detail: JSON.stringify(quotas.value)
  })
}

window.ipcRenderer.on(IpcChannels.ADD_PRIZE, (event) => {
  isLoadingInModal.value = false
  handleModalOpen(false)
  getPrize()
})

interface Prize {
  id: number;
  name: string;
  detail: Quota[];
}

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
  }
})

/* EDIT PRIZE */
const editedPrizeId = ref(0)

function editPrize(prize: Prize) {
  editedPrizeId.value = prize.id
  prizeName.value = prize.name
  isModalOpen.value = true

  if (prize.detail[0].value[0] === 'All Region') {
    quotas.value = prize.detail
    isAllRegion.value = true
    allRegionQuota.value = prize.detail[0].numOfItem
  } else {
    quotas.value = []
    isAllRegion.value = false
  }
}

function saveEditedPrize() {
  isLoadingInModal.value = true
  isLoadingInAction.value = true

  if (isAllRegion.value) {
    quotas.value = [
      {
        value: ['All Region'],
        text: ['All Region'],
        numOfItem: allRegionQuota.value
      }
    ]
  }

  window.ipcRenderer.send(IpcChannels.EDIT_PRIZE, {
    id: editedPrizeId.value,
    name: prizeName.value,
    detail: JSON.stringify(quotas.value)
  })
}

window.ipcRenderer.on(IpcChannels.EDIT_PRIZE, () => {
  isLoadingInModal.value = false
  isLoadingInAction.value = false
  handleModalOpen(false)
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

onMounted(() => {
  getPrize()
})
</script>

<template>
  <div>
    <div class="border-gray-800 rounded-md bg-black p-5 mt-5 mx-5 flex-col justify-center">
      <div class="flex gap-4 items-center justify-center">
        <button
          class="rounded-md bg-green-700 text-white hover:bg-amber-500 cursor-pointer py-3 px-8"
          @click="isModalOpen = true"
        >
          Create New Prize
        </button>
      </div>

      <!-- Table to display prizes -->
      <div class="overflow-auto max-h-96 mt-5">
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
                  {{ quota.text }}: {{ quota.numOfItem }}
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
                  @click="editPrize(prize)"
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
      :is-loading="isLoadingInModal"
      :is-open="isModalOpen"
      @update:isOpen="handleModalOpen($event)"
    >
      <div>
        <label>Prize Name : </label>
        <input
          v-model="prizeName"
          class="border-gray-300 rounded p-2 border"
          placeholder="prize name"
          type="text"
        >
      </div>

      <div class="flex gap-3 mt-3 items-center">
        <switch-component
          v-model:value="isAllRegion"
          @input="isAllRegion = $event"
        />
        <p>For All Region?</p>
        <input
          v-if="isAllRegion"
          v-model="allRegionQuota"
          class="border-gray-300 rounded p-2 border"
          placeholder="prize quota"
          type="number"
        >
      </div>
      <div v-if="!isAllRegion">
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
          v-for="(item, index) in quotas"
          :key="index"
          class="flex gap-3 items-center mt-3"
        >
          <multi-select-component
            :options="provinces"
            placeholder="Select Province"
            :selected-options="item.value"
            @update:modelValue="item.text = $event; item.value = $event"
          />
          <input
            v-model="item.numOfItem"
            class="border-gray-300 rounded p-2 border"
            placeholder="total pemenang"
            type="text"
          >
          <span
            class="rounded-full bg-red-700 hover:bg-orange-700 cursor-pointer px-3 py-1 text-white hover:scale-110"
            @click="quotas.splice(index, 1)"
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
          {{ editedPrizeId ? `Edit Prize ${editedPrizeId}` : 'Create New Prize' }}
        </button>
      </div>
    </modal-component>
  </div>
</template>
