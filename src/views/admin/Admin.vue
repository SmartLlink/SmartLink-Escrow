<template>
  <v-app :style="{ background: $vuetify.theme.themes.light.background }">
    <Navigation :drawer="drawer"></Navigation>
    <v-app-bar
      app
      :style="{ background: $vuetify.theme.themes.light.background }"
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Admin pannel</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="running-contract">
        Running contract:
        <code>{{ this.$store.state.contract.contractAddress }}</code>
      </span>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-skeleton-loader v-if="loadTable" class="mx-auto" type="table">
        </v-skeleton-loader>
        <section class="items" v-if="!loadTable">
          <h1 class="title">Transfers awaiting confirmation</h1>
          This will be an automated process ... .
          <table>
            <thead>
              <tr>
                <th v-for="header in headers" :key="header" class="text-center">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in itemsWaitingForTransfer" :key="item.id">
                <td>
                  <v-row align="center">
                    <v-col cols="auto">
                      <img
                        :src="require(`../../assets/${item.picture}`)"
                        aspect-ratio="1"
                        width="55px"
                      />
                    </v-col>
                    <v-col cols="auto">
                      <span class="name">{{ item.name }}</span>
                      <br />
                      <span class="date">Last update on {{ item.update }}</span>
                    </v-col>
                  </v-row>
                </td>
                <td class="text-center">{{ item.buyer }}</td>
                <td class="text-center">
                  {{ item.total_escrow.escrow / 1000000 }}
                  <img :src="require(`../../assets/tezos.png`)" width="10px" />
                </td>
                <td class="text-center">
                  <v-btn
                    v-if="!item.confirmation"
                    depressed
                    color="main"
                    class="buy"
                    @click="validateSellerTransmission(item.id)"
                  >
                    Confirm transfer
                  </v-btn>
                  <div class="loading" v-if="item.confirmation">
                    <v-progress-circular indeterminate color="primary">
                    </v-progress-circular>
                    <span class="subtitle-1"> Sending transaction...</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        <section class="items">
          <h1 class="title">Exchange information</h1>
          <table>
            <thead>
              <tr>
                <th
                  v-for="header in commissions_headers"
                  :key="header"
                  class="text-center"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="text-center">Global slashing Rate</td>
                <td class="text-center">
                  {{ this.$store.state.contract.slashingRate }}
                </td>
              </tr>
              <tr v-for="item in commissions" :key="item.id">
                <td class="text-center">{{ info[item[0]].name }} commission</td>
                <td class="text-center">
                  {{ item[1] }}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" src="./Admin.ts"></script>
<style lang="scss" scoped src="./admin.scss"></style>
