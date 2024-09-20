<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import MultiSelectComponent from '../components/MultiSelectComponent.vue';
import html2pdf from "html2pdf.js"; // Import html2pdf.js
import {IpcChannels} from '../constants/IpcChannels';

const selectedPrizeId = ref<number[]>([])
const categoryOptions = ref([
  {
    id: 1,
    name: 'Grand Prize'
  },
  {
    id: 2,
    name: 'Premium Prize'
  }
])
const title = ref('Pemenang Lucky Draw Festival Fantasi Junior Indie')

/* NAME INPUT */
const notaris = ref('R.Kusmartono SH')
const kementerianSosialLeft = ref('Dini Afria Puspita')
const kementerianSosialRight = ref('Nur Umaini Afidah')
const dinasSosial = ref('Rita Indah Yulistanti')
const cimbLeft = ref('Lilyana Setiawan')
const cimbRight = ref('Tia Septiani Thamrin')
const globe = ref('Susana K. Wijaya, SE')

function generatePDF() {
  const element = document.getElementById('pdf-content');
  if (element) {
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5], // top, left, bottom, right margins in inches
      image: {type: 'jpeg', quality: 1},
      html2canvas: {scale: 2},
      jsPDF: {unit: 'in', format: 'letter', orientation: 'portrait'}
    };
    html2pdf().set(opt).from(element).save();
  }
}

/* GET WINNER BY CATEGORY */
const winners = ref<any>([])

function fillBody() {
  window.ipcRenderer.send(IpcChannels.GET_WINNER_BY_CATEGORY, [...selectedPrizeId.value])
}

window.ipcRenderer.on(IpcChannels.GET_WINNER_BY_CATEGORY, (event, listOfWinner) => {
  winners.value = listOfWinner
})

</script>

<template>
  <div class="mt-8">
    <!-- SETTINGS -->
    <div class="rounded-md border-2 border-gray-300 p-3 m-3">
      <div class="flex gap-3 items-center">
        <p class="font-bold">Winner Category :</p>
        <multi-select-component
          :options="categoryOptions"
          placeholder="Select Prize"
          @update:modelValue="selectedPrizeId = $event"
        />
        <button
          class="ml-3 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
          @click="fillBody()"
        >
          apply settings
        </button>
      </div>
      <div class="flex gap-3 my-3 items-center">
        <p class="font-bold">Title: </p>
        <input v-model="title" class="border-2 border-gray-300 rounded-md p-1 w-1/2" type="text"/>
      </div>
      <div class="mt-3">
        <p class="font-bold">Footer Settings</p>
        <hr class="my-3">

        <!-- MENTERI SOSIAL DAN NOTATIS       -->
        <div class="flex m-3 gap-72">
          <div class="flex flex-col gap-24">
            <p class="text-sm font-bold">NOTARIS</p>
            <input v-model="notaris" class="border-2 border-gray-300 rounded-md p-1" type="text"/>
          </div>
          <div class="flex flex-col gap-24">
            <p class="text-sm font-bold">KEMENTERIAN SOSIAL RI</p>
            <div class="flex gap-3">
              <input v-model="kementerianSosialLeft" class="border-2 border-gray-300 rounded-md p-1" type="text"/>
              <input v-model="kementerianSosialRight" class="border-2 border-gray-300 rounded-md p-1" type="text"/>
            </div>
          </div>
        </div>

        <!--DINAS SOSIAL DAN CIMB       -->
        <div class="flex m-3 gap-64 mt-8">
          <div class="flex flex-col gap-24">
            <p class="text-sm font-bold">DINAS SOSIAL PROV DKI JAKARTA</p>
            <input v-model="dinasSosial" class="border-2 border-gray-300 rounded-md p-1" type="text"/>
          </div>
          <div class="flex flex-col gap-24">
            <p class="text-sm font-bold">KPT. Bank CIMB Niaga Tbk</p>
            <div class="flex gap-3">
              <input v-model="cimbLeft" class="border-2 border-gray-300 rounded-md p-1" type="text"/>
              <input v-model="cimbRight" class="border-2 border-gray-300 rounded-md p-1" type="text"/>
            </div>
          </div>
        </div>

        <!-- GLOBE PROMOTION SERVICE-->
        <div class="flex m-3 mt-8">
          <div class="flex flex-col gap-24">
            <p class="text-sm font-bold">GLOBE PROMOTION SERVICE</p>
            <input v-model="globe" class="border-2 border-gray-300 rounded-md p-1" type="text"/>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center my-3">
      <button
        class="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        @click="generatePDF"
      >
        Generate PDF
      </button>
    </div>

    <!-- DEM0 -->
    <div class="rounded-md border-2 border-gray-300 p-8 mb-5">
      <div id="pdf-content" class="small-text">
        <!-- BODY -->

        <p class="mb-3 font-bold text-sm">{{ title }}</p>
        <!-- table to show winners -->
        <div class="flex justify-center items-center mb-8">
          <table class="table-auto w-full border-gray-300">
            <thead>
            <tr>
              <th class="p-1 border bg-purple-500">No</th>
              <th class="p-1 border bg-purple-500">Prize</th>
              <th class="p-1 border bg-purple-500">RollId</th>
              <th class="p-1 border bg-purple-500">Customer Name</th>
              <th class="p-1 border bg-purple-500">Area</th>
              <th class="p-1 border bg-purple-500">Time</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(winner, index) in winners" :key="winner.id">
              <td class="border text-center">{{ index + 1 }}</td>
              <td class="border text-center">{{ winner.prize_name }}</td>
              <td class="border text-center">{{ winner.roll_id }}</td>
              <td class="border text-center">{{ winner.customer_name }}</td>
              <td class="border text-center">{{ winner.region }}</td>
              <td class="border text-center">{{ winner.created_at }}</td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- FOOTER -->
        <!-- MENTERI SOSIAL DAN NOTATIS  -->
        <div class="flex justify-around text-center">
          <div class="flex flex-col gap-16">
            <p class="font-bold">NOTARIS</p>
            <p>{{ notaris }}</p>
          </div>
          <div class="flex flex-col gap-16">
            <p class="font-bold">KEMENTERIAN SOSIAL RI</p>
            <div class="flex gap-12">
              <p>{{ kementerianSosialLeft }}</p>
              <p>{{ kementerianSosialRight }}</p>
            </div>
          </div>
        </div>

        <!--DINAS SOSIAL DAN CIMB       -->
        <div class="flex justify-around mt-8 text-center">
          <div class="flex flex-col gap-16">
            <p class="font-bold">DINAS SOSIAL PROV DKI JAKARTA</p>
            <p>{{ dinasSosial }}</p>
          </div>
          <div class="flex flex-col gap-16">
            <p class="font-bold">KPT. Bank CIMB Niaga Tbk</p>
            <div class="flex gap-12">
              <p>{{ cimbLeft }}</p>
              <p>{{ cimbRight }}</p>
            </div>
          </div>
        </div>

        <!-- GLOBE PROMOTION SERVICE-->
        <div class="flex justify-around text-center my-8">
          <div class="flex flex-col gap-16">
            <p class="font-bold">GLOBE PROMOTION SERVICE</p>
            <p>{{ globe }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.small-text {
  font-size: 10px;
}
</style>