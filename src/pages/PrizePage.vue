<script lang="ts" setup>
import {computed, onMounted, ref} from "vue";
import SelectComponent from "../components/SelectComponent.vue";
import ModalComponent from "../components/ModalComponent.vue";
import {IpcChannels} from "../constants/ipcChannels";
import SwitchComponent from "../components/SwitchComponent.vue";

const isLoadingInAction = ref(false)

interface Quota {
  value: string;
  text: string;
  numOfItem: number;
}

/* MODAL */
const isModalOpen = ref(false)
const isLoadingInModal = ref(false)

function handleModalOpen(isOpen: boolean) {
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
    value: 'Aceh',
    text: 'Aceh'
  },
  {
    value: 'Sumatera Utara',
    text: 'Sumatera Utara'
  },
  {
    value: 'Sumatera Barat',
    text: 'Sumatera Barat'
  },
  {
    value: 'Riau',
    text: 'Riau'
  },
  {
    value: 'Jambi',
    text: 'Jambi'
  },
  {
    value: 'Sumatera Selatan',
    text: 'Sumatera Selatan'
  },
  {
    value: 'Bengkulu',
    text: 'Bengkulu'
  },
  {
    value: 'Lampung',
    text: 'Lampung'
  },
  {
    value: 'Kepulauan Bangka Belitung',
    text: 'Kepulauan Bangka Belitung'
  },
  {
    value: 'Kepulauan Riau',
    text: 'Kepulauan Riau'
  },
  {
    value: 'DKI Jakarta',
    text: 'DKI Jakarta'
  },
  {
    value: 'Jawa Barat',
    text: 'Jawa Barat'
  },
  {
    value: 'Jawa Tengah',
    text: 'Jawa Tengah'
  },
  {
    value: 'DI Yogyakarta',
    text: 'DI Yogyakarta'
  },
  {
    value: 'Jawa Timur',
    text: 'Jawa Timur'
  },
  {
    value: 'Banten',
    text: 'Banten'
  },
  {
    value: 'Bali',
    text: 'Bali'
  },
  {
    value: 'Nusa Tenggara Barat',
    text: 'Nusa Tenggara Barat'
  },
  {
    value: 'Nusa Tenggara Timur',
    text: 'Nusa Tenggara Timur'
  },
  {
    value: 'Kalimantan Barat',
    text: 'Kalimantan Barat'
  },
  {
    value: 'Kalimantan Tengah',
    text: 'Kalimantan Tengah'
  },
  {
    value: 'Kalimantan Selatan',
    text: 'Kalimantan Selatan'
  },
  {
    value: 'Kalimantan Timur',
    text: 'Kalimantan Timur'
  },
  {
    value: 'Kalimantan Utara',
    text: 'Kalimantan Utara'
  },
  {
    value: 'Sulawesi Utara',
    text: 'Sulawesi Utara'
  },
  {
    value: 'Sulawesi Tengah',
    text: 'Sulawesi Tengah'
  },
  {
    value: 'Sulawesi Selatan',
    text: 'Sulawesi Selatan'
  },
  {
    value: 'Sulawesi Tenggara',
    text: 'Sulawesi Tenggara'
  },
  {
    value: 'Gorontalo',
    text: 'Gorontalo'
  },
  {
    value: 'Sulawesi Barat',
    text: 'Sulawesi Barat'
  },
  {
    value: 'Maluku',
    text: 'Maluku'
  },
  {
    value: 'Maluku Utara',
    text: 'Maluku Utara'
  },
  {
    value: 'Papua',
    text: 'Papua'
  },
  {
    value: 'Papua Barat',
    text: 'Papua Barat'
  }
]

function addRow() {
  quotas.value.push({
    value: 'DKI Jakarta',
    text: 'DKI Jakarta',
    numOfItem: 1
  },)
}

function saveNewPrize() {
  isLoadingInModal.value = true

  if (isAllRegion.value) {
    quotas.value = [
      {
        value: 'All Region',
        text: 'All Region',
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
  quotas.value = prize.detail
  prizeName.value = prize.name
  isModalOpen.value = true

  if (prize.detail[0].value === 'All Region') {
    allRegionQuota.value = prize.detail[0].numOfItem
  } else {
    isAllRegion.value = false
  }
}

function saveEditedPrize() {
  isLoadingInModal.value = true
  isLoadingInAction.value = true

  if (isAllRegion.value) {
    quotas.value = [
      {
        value: 'All Region',
        text: 'All Region',
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
    <div class="border-gray-800 rounded-md bg-blue-300 p-5 mt-5 mx-5 flex-col justify-center">
      <div class="flex gap-4 items-center justify-center">
        <button
          class="rounded-md bg-green-700 text-white hover:bg-amber-500 cursor-pointer py-3 px-8"
          @click="getPrize()"
        >
          Get Prize
        </button>
        <button
          class="rounded-md bg-green-700 text-white hover:bg-amber-500 cursor-pointer py-3 px-8"
          @click="isModalOpen = true"
        >
          Create New Prize
        </button>
      </div>

      <!-- Table to display prizes -->
      <div class="overflow-auto max-h-96 mt-5">
        <table class="table-auto w-full mt-5">
          <thead>
          <tr>
            <th class="px-4 py-2 border border-gray-800">ID</th>
            <th class="px-4 py-2 border border-gray-800">Name</th>
            <th class="px-4 py-2 border border-gray-800">Quota</th>
            <th class="px-4 py-2 border border-gray-800">Action</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="prize in prizes" :key="prize.id" class="text-center">
            <td class="border px-4 py-2 border-gray-800">{{ prize.id }}</td>
            <td class="border px-4 py-2 border-gray-800">{{ prize.name }}</td>
            <td class="border px-4 py-2 border-gray-800">
              <ul>
                <li v-for="(quota, index) in prize.detail" :key="index">
                  {{ quota.text }}: {{ quota.numOfItem }}
                </li>
              </ul>
            </td>
            <td class="border px-4 py-2 border-gray-800">
              <div
                v-if="!isLoadingInAction"
                class="flex gap-2 justify-center items-center"
              >
                <button
                  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  @click="editPrize(prize)"
                >
                  Edit
                </button>
                <button
                  class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-2"
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
          :id="item.value"
          class="flex gap-3 items-center mt-3"
        >
          <select-component
            :id="index"
            :model-value="quotas[index].value"
            :options="provinces"
            @update:model-value="quotas[index].text = $event; quotas[index].value = $event"
          />
          <input
            v-model="quotas[index].numOfItem"
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
