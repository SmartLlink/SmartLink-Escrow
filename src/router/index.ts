/**
 * @module smart-link-Escrow
 * @author Smart-Chain
 * @version 1.0.0
 * This module manages the Vue app routing
 */
import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import Home from '@/views/home/Home.vue';

Vue.use(VueRouter);

const routes: RouteConfig[] = [
  {
    path: '/originate',
    alias: '/',
    name: 'originate',
    component: Home,
    props: true
  },
  {
    path: '/offers/',
    name: 'offers',
    component: () => import(/* webpackChunkName: "about" */ '@/views/offers/Offers.vue'),
    props: true
  },
  {
    path: '/offer/:id',
    name: 'Offer',
    component: () => import(/* webpackChunkName: "about" */ '@/views/view-item/View-item.vue'), 
    props: true
  },
  {
    path: '/buy/:id',
    name: 'Buy item',
    component: () => import(/* webpackChunkName: "about" */ '@/views/view-item/View-item.vue'), 
    props: true
  },
  {
    path: '/order/:id',
    name: 'Order',
    component: () => import(/* webpackChunkName: "about" */ '@/views/view-item/View-item.vue'), 
    props: true
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import(/* webpackChunkName: "about" */ '@/views/admin/Admin.vue'), 
    props: true
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import(/* webpackChunkName: "about" */ '@/views/tracking/Tracking.vue'), 
    props: true
  },
  {
    path: '/marketplace',
    name: 'marketplace',
    component: () => import(/* webpackChunkName: "about" */ '@/views/marketplace/Marketplace.vue'), 
    props: true
  }
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

/**
    * Globa before guard that checks if there is a contract address in the local storage of the user. 
    * If there is no contract address, then every routes are redrected to /originate route
    * Else, the user stays on the route he queried
    */
router.beforeEach((to, from, next) => {
  // To avoid recrusion, perform the action only if we are not on the originate route
  if(to.name!=='originate') {
    // Check if there is a vuex local storage: if it exists, retrieve the contract object, else return null
    const contract = (localStorage.getItem('vuex') !== null && typeof localStorage.getItem('vuex') !== undefined)?JSON.parse(localStorage.getItem('vuex')!).contract:null;
    
    // Check if the contract exists, if it exists retrive the contractAddress from the contract object, else return null
    const contractAddress = (contract !== null && typeof contract !== undefined)?contract.contractAddress:null;

    // Check if the contractAddress exists and was retrieved successfully
    // If not, redirect the user to the originate route
    // Else, confirm the navigation and redirect the user to the queried route
    if(contractAddress === null || typeof contractAddress === undefined )
    { next({ name: 'originate' })}
    else next()
  }
  // If the route is originate, then just confirm the navigation and load it
  else next()
})

export default router;
