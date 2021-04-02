<template>
  <v-app :style="{ background: $vuetify.theme.themes.light.background }">
    <Navigation :drawer="drawer"></Navigation>
    <v-app-bar
      app
      :style="{ background: $vuetify.theme.themes.light.background }"
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Offers</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="running-contract">
        Running contract:
        <code>{{ this.$store.state.contract.contractAddress }}</code>
      </span>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-skeleton-loader
          v-if="loadTable"
          class="mx-auto"
          type="table"
        ></v-skeleton-loader>
        <div class="items" v-if="!loadTable">
          <v-row class="table-title" align="center">
            <v-col cols="auto">
              <span class="title">Recent offers</span>
            </v-col>
            <v-spacer></v-spacer>
            <v-col cols="auto">
              Filter by:
              <v-btn-toggle v-model="period" color="main" class="filter" group>
                <v-btn value="day"> Day </v-btn>
                <v-btn value="week"> Week </v-btn>
                <v-btn value="month"> Month </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
          <table>
            <thead>
              <tr>
                <th v-for="header in headers" :key="header" class="text-center">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredEvents()" :key="item.id">
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
                      <span class="date"
                        >Posted: 
                        {{ new Date(item.date).toLocaleString() }}
                      </span>
                    </v-col>
                  </v-row>
                </td>
                <td class="text-center">{{ item.seller }}</td>
                <td class="text-center">
                  {{ item.total }}
                  <img :src="require(`../../assets/tezos.png`)" width="10px" />
                  <br />
                  <span class="fees">
                    Fees: {{ item.fees }}
                    <img :src="require(`../../assets/tezos.png`)" width="6px" />
                  </span>
                  <br />
                  <span class="fees">
                    Shipping: {{ item.shipping }}
                    <img :src="require(`../../assets/tezos.png`)" width="6px" />
                  </span>
                </td>
                <td class="text-center">
                  <v-btn
                    depressed
                    rounded
                    color="main"
                    class="buy"
                    :href="`/buy/${item.id}`"
                  >
                    Buy
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts" src="./Marketplace.ts"></script>
<style lang="scss" scoped src="./marketplace.scss"></style>
