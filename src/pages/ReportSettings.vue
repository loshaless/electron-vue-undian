<script lang="ts" setup>
import {ref} from 'vue'
import MultiSelectComponent from '../components/MultiSelectComponent.vue';
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

/* TITLE */
const title = ref('Pemenang Lucky Draw Festival Fantasi Junior Indie')
const todayDate = new Date().toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})
const subtitle = ref(todayDate)

/* NAME INPUT */
const notaris = ref('R.Kusmartono SH')
const kementerianSosialLeft = ref('Dini Afria Puspita')
const kementerianSosialRight = ref('Nur Umaini Afidah')
const dinasSosial = ref('Rita Indah Yulistanti')
const cimbLeft = ref('Lilyana Setiawan')
const cimbRight = ref('Tia Septiani Thamrin')
const globe = ref('Susana K. Wijaya, SE')

/* DATE INPUT */
const placeAndDate = ref(`Jakarta, ${todayDate}`)

/* GENERATE PDF */
function generatePDF() {
  const element = document.getElementById('pdf-content');
  if (element) {
    const htmlContent = element.outerHTML;
    const blob = new Blob([htmlContent], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.html';
    a.click();
    URL.revokeObjectURL(url);
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
    <div class="rounded-md border-2 border-gray-300 p-3 my-3 mx-5">
      <p class="font-bold text-center bg-red-500 text-white p-2 rounded-md mb-3">Header Settings</p>
      <div class="flex gap-3 items-center">
        <p class="font-bold">Winner Category :</p>
        <multi-select-component
          :options="categoryOptions"
          placeholder="Select Prize"
          @update:modelValue="selectedPrizeId = $event"
        />
        <button
          class="ml-3 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 hover:scale-110"
          @click="fillBody()"
        >
          apply settings
        </button>
      </div>
      <div class="flex gap-3 my-3 items-center">
        <p class="font-bold">Title: </p>
        <input v-model="title" class="border-2 border-gray-300 rounded-md p-1 w-1/2" type="text"/>
      </div>
      <div class="flex gap-3 my-3 items-center">
        <p class="font-bold">Subtitle: </p>
        <input v-model="subtitle" class="border-2 border-gray-300 rounded-md p-1 w-1/2" type="text"/>
      </div>
      
      <div class="mt-8">
        <p class="font-bold text-center bg-red-500 text-white p-2 rounded-md mb-3">Footer Settings</p>
        <div class="flex gap-3 items-center">
          <p class="font-bold">Place and Date: </p>
          <input v-model="placeAndDate" class="border-2 border-gray-300 rounded-md p-1 w-1/2" type="text"/>
        </div>

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
        class="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 hover:scale-110"
        @click="generatePDF"
      >
        Generate File
      </button>
    </div>

    <!-- DEM0 -->
    <div class="rounded-md border-2 border-gray-300 p-8 mb-5 mx-5">
      <div id="pdf-content" style="font-size: 12px; margin-left: 5rem; margin-right: 5rem;">
        <!-- BODY -->

        <p style="font-weight: bold; font-size: 0.9rem;">{{ title }}</p>
        <p style="margin-bottom: 0.75rem; font-weight: bold; font-size: 0.875rem;">{{ subtitle }}</p>
        <!-- table to show winners -->
        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 2rem;">

          <table style="width: 100%; border-collapse: collapse; border-color: #D1D5DB;">
            <thead>
            <tr style="color: white;">
              <th style="padding: 0.25rem; border: 1px solid; background-color: #6B21A8;">No</th>
              <th style="padding: 0.25rem; border: 1px solid; background-color: #6B21A8;">Prize</th>
              <th style="padding: 0.25rem; border: 1px solid; background-color: #6B21A8;">RollId</th>
              <th style="padding: 0.25rem; border: 1px solid; background-color: #6B21A8;">Customer Name</th>
              <th style="padding: 0.25rem; border: 1px solid; background-color: #6B21A8;">Area</th>
              <th style="padding: 0.25rem; border: 1px solid; background-color: #6B21A8;">Time</th>
            </tr>
            </thead>
            <tbody>

            <tr v-for="(winner, index) in winners" :key="winner.id">
              <td style="border: 1px solid; text-align: center;">{{ index + 1 }}</td>
              <td style="border: 1px solid; text-align: center;">{{ winner.prize_name }}</td>
              <td style="border: 1px solid; text-align: center;">{{ winner.roll_id }}</td>
              <td style="border: 1px solid; text-align: center;">{{ winner.customer_name }}</td>
              <td style="border: 1px solid; text-align: center;">{{ winner.region }}</td>
              <td style="border: 1px solid; text-align: center;">{{ winner.created_at }}</td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- FOOTER -->
        <div style="display: flex;">
          <p style="font-weight: bold;">{{ placeAndDate }}</p>
        </div>
        <!-- MENTERI SOSIAL DAN NOTATIS  -->
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div style="display: flex; flex-direction: column; gap: 4rem;">
            <p style="font-weight: bold;">NOTARIS</p>
            <p>{{ notaris }}</p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4rem;">
            <p style="font-weight: bold;">KEMENTERIAN SOSIAL RI</p>
            <div style="display: flex; gap: 3rem;">
              <p>{{ kementerianSosialLeft }}</p>
              <p>{{ kementerianSosialRight }}</p>
            </div>
          </div>
        </div>

        <!--DINAS SOSIAL DAN CIMB       -->
        <div style="display: flex; justify-content: space-around; margin-top: 2rem; text-align: center;">
          <div style="display: flex; flex-direction: column; gap: 4rem;">
            <p style="font-weight: bold;">DINAS SOSIAL PROV DKI JAKARTA</p>
            <p>{{ dinasSosial }}</p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4rem;">
            <p style="font-weight: bold;">KPT. Bank CIMB Niaga Tbk</p>
            <div style="display: flex; gap: 3rem;">
              <p>{{ cimbLeft }}</p>
              <p>{{ cimbRight }}</p>
            </div>
          </div>
        </div>

        <!-- GLOBE PROMOTION SERVICE-->
        <div style="display: flex; justify-content: space-around; text-align: center; margin: 2rem 0;">
          <div style="display: flex; flex-direction: column; gap: 4rem;">
            <p style="font-weight: bold;">GLOBE PROMOTION SERVICE</p>
            <p>{{ globe }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
