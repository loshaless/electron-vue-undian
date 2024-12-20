<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import MultiSelectComponent from '../components/MultiSelectComponent.vue';
import {IpcChannels} from '../constants/enum/IpcChannels';

const selectedCategoryId = ref<number[]>([])
const categoryOptions = ref([])
onMounted(() => {
  window.ipcRenderer.send(IpcChannels.GET_CATEGORY_JOIN_PRIZE)
})

window.ipcRenderer.on(IpcChannels.GET_CATEGORY_JOIN_PRIZE, (event, category) => {
  categoryOptions.value = category
})

/* TITLE */
const title = ref('Pemenang Lucky Draw Festival Fantasi Junior Indie')
const todayDate = new Date().toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})
const subtitle = ref(todayDate)

/* NAME INPUT */
interface Signer {
  position: string
  name: string[]
}

const signers = ref<Signer[]>(
  [
    {
      position: 'NOTARIS',
      name: ['R.Kusmartono SH']
    },
    {
      position: 'KEMENTERIAN SOSIAL RI',
      name: ['Dini Afria Puspita', 'Nur Umaini Afidah']
    },
    {
      position: 'DINAS SOSIAL PROV DKI JAKARTA',
      name: ['Rita Indah Yulistanti']
    },
    {
      position: 'KPT. Bank CIMB Niaga Tbk',
      name: ['Lilyana Setiawan', 'Tia Septiani Thamrin']
    },
    {
      position: 'GLOBE PROMOTION SERVICE',
      name: ['Susana K. Wijaya, SE']
    }
  ]
)

function addSigner() {
  signers.value.push({
    position: 'position name',
    name: ['signer name']
  })
}

function removeSigner(indexSigner: number) {
  signers.value.splice(indexSigner, 1)
}

function addName(indexSigner: number) {
  signers.value[indexSigner].name.push('signer name')
}

function removeName(indexSigner: number, indexName: number) {
  signers.value[indexSigner].name.splice(indexName, 1)
}

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

/* GENERATE TXT */
function generateTxt() {
  window.ipcRenderer.send(IpcChannels.CREATE_TXT_REPORT, [...selectedCategoryId.value])
}

/* GET WINNER BY CATEGORY */
const winners = ref<any>([])

function fillBody() {
  window.ipcRenderer.send(IpcChannels.GET_WINNER_BY_CATEGORY, [...selectedCategoryId.value])
}

window.ipcRenderer.on(IpcChannels.GET_WINNER_BY_CATEGORY, (event, listOfWinner) => {
  winners.value = listOfWinner
})

</script>

<template>
  <div class="mt-8">
    <!-- SETTINGS -->
    <div class="rounded-md border-2 border-gray-300 p-3 my-3 mx-5">
      <p class="font-bold text-center bg-[#ED1C24] text-white p-2 rounded-md mb-3">Header Settings</p>
      <div class="flex gap-1 items-center">
        <p class="font-bold">Winner Category :</p>
        <multi-select-component
          :options="categoryOptions"
          placeholder="Select Prize"
          @update:modelValue="selectedCategoryId = $event"
        />
        <button
          class="button-selected py-2 px-5 rounded-md ml-3"
          @click="fillBody()"
        >
          apply
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
        <p class="font-bold text-center bg-[#ED1C24] text-white p-2 rounded-md mb-3">Footer Settings</p>
        <div class="flex gap-3 items-center">
          <p class="font-bold">Place and Date: </p>
          <input v-model="placeAndDate" class="border-2 border-gray-300 rounded-md p-1 w-1/2" type="text"/>
        </div>

        <div class="w-full flex flex-wrap mb-12 box-border">
          <div
            v-for="(signer, indexSigner) in signers"
            :key="indexSigner"
            class="w-1/2 flex box-border mt-6"
          >
            <div class="flex flex-col gap-20 w-full">
              <div class="border-2 border-gray-300 rounded-md p-1 font-bold mr-4 flex gap-3">
                <input
                  class="w-full"
                  v-model="signer.position"
                  type="text"
                />
                <!-- close icon -->
                 <img
                  src="/icon-trash-can.svg"
                  alt="delete"
                  class="w-5 h-5 cursor-pointer hover:scale-110"
                  @click="removeSigner(indexSigner)"
                >
              </div>
              <div class="flex w-full items-center">
                <div
                  v-for="(name, indexName) in signer.name"
                  :key="indexName"
                  class="border-2 border-gray-300 rounded-md p-1 flex gap-2 w-1/4 mr-2"
                >
                  <input
                    class="w-3/4"
                    v-model="signer.name[indexName]"
                    type="text"
                  >
                  <img
                    src="/icon-trash-can.svg"
                    alt="delete"
                    class="w-5 h-5 cursor-pointer hover:scale-110"
                    @click="removeName(indexSigner, indexName)"
                  >
                </div>
                <img
                  src="/icon-add.png"
                  alt="add"
                  class="w-8 h-8 cursor-pointer hover:scale-110"
                  @click="addName(indexSigner)"
                >
              </div>
            </div>
          </div>
          <div
            class="min-h-32 w-1/4 flex box-border mt-6 items-center justify-center bg-[#f8f8f8] cursor-pointer rounded-lg hover:bg-[#efefef] hover:scale-105 shadow-md shadow-gray-400"
            @click="addSigner"
          >
            <img src="/icon-add.png" alt="add">
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center my-3 gap-3">
      <button
        :disabled="!selectedCategoryId.length"
        :class="[
          {'cursor-not-allowed button-standby': !selectedCategoryId.length},
          {'cursor-pointer button-selected': selectedCategoryId.length}
        ]"
        class="py-2 px-32 rounded-md"
        @click="generatePDF"
      >
        Generate Report PDF
      </button>

      <button
        :disabled="!selectedCategoryId.length"
        :class="[
          {'cursor-not-allowed button-standby': !selectedCategoryId.length},
          {'cursor-pointer button-selected': selectedCategoryId.length}
        ]"
        class="py-2 px-32 rounded-md"
        @click="generateTxt"
      >
        Generate File Txt
      </button>
    </div>

    <!-- DEM0 -->
    <div class="rounded-md border-2 border-gray-300 p-8 mb-5 mx-5">
      <div id="pdf-content" style="font-size: 12px; margin-left: 2rem; margin-right: 2rem; margin-top: 3rem;">
        <!-- BODY -->
        <p style="font-weight: bold; font-size: 0.9rem;">{{ title }}</p>
        <p style="margin-bottom: 0.75rem; font-weight: bold; font-size: 0.875rem;">{{ subtitle }}</p>
        <!-- table to show winners -->
        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 2rem;">

          <table style="width: 100%; border-collapse: collapse; border-color: #D1D5DB;">
            <thead>
            <tr style="color: white;">
              <th style="padding: 0.25rem; border: 1px solid; background-color: #ED1C24;">No</th>
              <th style="padding: 0.25rem; border: 1px solid; background-color: #ED1C24;">Prize</th>
              <th style="padding: 0.25rem; border: 1px solid; background-color: #ED1C24;">Nomor Undian</th>
              <th style="padding: 0.25rem; border: 1px solid; background-color: #ED1C24;">Customer Name</th>
              <th style="padding: 0.25rem; border: 1px solid; background-color: #ED1C24;">Branch</th>
              <th style="padding: 0.25rem; border: 1px solid; background-color: #ED1C24;">Region</th>
              <th style="padding: 0.25rem; border: 1px solid; background-color: #ED1C24;">Time</th>
            </tr>
            </thead>
            <tbody>

            <tr v-for="(winner, index) in winners" :key="winner.id">
              <td style="border: 1px solid; text-align: center;">{{ index + 1 }}</td>
              <td style="border: 1px solid; text-align: center;">{{ winner.prize_name }}</td>
              <td style="border: 1px solid; text-align: center;">{{ winner.roll_id }}</td>
              <td style="border: 1px solid; text-align: center;">{{ winner.customer_name }}</td>
              <td style="border: 1px solid; text-align: center;">{{ winner.branch }}</td>
              <td style="border: 1px solid; text-align: center;">{{ winner.region }}</td>
              <td style="border: 1px solid; text-align: center;">{{ winner.created_at }}</td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- FOOTER -->
        <!-- PLACE AND DATE -->
        <div style="display: flex; margin-bottom: 0.5rem;">
          <p style="font-weight: bold;">{{ placeAndDate }}</p>
        </div>

        <!-- SIGNERS -->
        <div style="width: 100%; display: flex; flex-wrap: wrap; margin-bottom: 3rem;">
          <div
            v-for="(signer, indexSigner) in signers"
            :key="indexSigner"
            style="width: 50%; display: flex; box-sizing: border-box; margin-bottom: 1rem;"
          >
            <div style="flex-direction: column; display: flex; gap: 4.5rem;">
              <p style="font-weight: bold;">{{ signer.position }}</p>
              <div style="display: flex; gap: 3rem;">
                <p
                  v-for="(name, indexName) in signer.name"
                  :key="indexName"
                >
                  {{ name }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
