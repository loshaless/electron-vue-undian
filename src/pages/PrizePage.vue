<script lang="ts" setup>
import {ref} from "vue";
import SelectComponent from "../components/SelectComponent.vue";
import ModalComponent from "../components/ModalComponent.vue";

const prizeName = ref("prizeName");
const isModalOpen = ref(false)

interface Quota {
  value: string;
  id: string;
  numOfItem: number;
}

const quotas = ref<Quota[]>([{
  value: 'Aceh',
  text: 'Aceh'
},]);

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
    id: 'DKI Jakarta',
    numOfItem: 0
  },)
}

function saveNewPrize() {

}
</script>

<template>
  <div>
    <div class="border-gray-800 rounded-md bg-blue-300 p-5 mt-5 mx-5 flex justify-center">
      <modal-component
        :is-open="isModalOpen"
        @update:isOpen="isModalOpen = $event"
      >
        <div>
          <label>Prize Name : </label>
          <input
            v-model="prizeName"
            class="border-gray-800 rounded p-1"
            type="text"
          >
        </div>

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
          :id="item.id"
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
            class="border-gray-800 rounded p-2"
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

        <div class="flex justify-center mt-5">
          <button
            class="rounded-md bg-green-700 text-white hover:bg-amber-500 cursor-pointer py-3 px-8"
            @click="saveNewPrize()"
          >
            Save
          </button>
        </div>
      </modal-component>

      <button
        class="rounded-md bg-green-700 text-white hover:bg-amber-500 cursor-pointer py-3 px-8"
        @click="isModalOpen = true"
      >
        Create New Prize
      </button>
    </div>
  </div>
</template>
