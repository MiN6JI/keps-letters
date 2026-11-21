<script setup>
import { useAuth } from 'src/stores/auth'
const auth = useAuth()
const nav = [
  { to: '/', icon: 'home', label: 'Home' },
  { to: '/generate', icon: 'edit_note', label: 'Generate' },
  { to: '/files', icon: 'folder', label: 'Files' },
  { to: '/queue', icon: 'inbox', label: 'My queue' },
  { to: '/templates', icon: 'description', label: 'Templates' },
  { to: '/admin', icon: 'settings', label: 'Admin', admin: true },
  { to: '/settings', icon: 'tune', label: 'Settings' }
]
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-drawer show-if-above :width="220" bordered>
      <div class="q-pa-md text-weight-bold text-primary">Letters</div>
      <q-list padding>
        <template v-for="n in nav" :key="n.to">
          <q-item v-if="!n.admin || auth.isAdmin" clickable :to="n.to" exact>
            <q-item-section avatar><q-icon :name="n.icon" /></q-item-section>
            <q-item-section>{{ n.label }}</q-item-section>
          </q-item>
        </template>
      </q-list>
      <div class="absolute-bottom q-pa-md">
        <div class="text-weight-medium">{{ auth.me?.display_name }}</div>
        <div class="muted small q-mb-sm">{{ auth.me?.role }}</div>
        <q-btn outline dense class="full-width" label="Sign out" @click="auth.logout()" />
      </div>
    </q-drawer>
    <q-page-container><router-view /></q-page-container>
  </q-layout>
</template>
