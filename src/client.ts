import { $, NoSerialize, Signal, noSerialize } from '@builder.io/qwik'
// @ts-ignore
import webManifest from 'virtual:qwik-pwa/manifest'
import { useOnWindow, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";

const installPromptKey = 'qwik-pwa:hide-install'

export function usePWA() {
  const registrationError = useSignal(false)
  const swActivated = useSignal(false)
  const showInstallPrompt = useSignal(false)
  const hideInstall = useSignal(false)
  const swRegistration = useSignal<NoSerialize<ServiceWorkerRegistration> | null>()

  const offlineReady = useSignal(false)
  const needRefresh = useSignal(false)

  const isPWAInstalled = useSignal(false)

  let deferredPrompt: Signal<NoSerialize<InstallPromptEvent> | null> = useSignal(null)
  let beforeInstallPrompt: Signal<NoSerialize<EventListener> | null> = useSignal(null)

  let install = $(async () => {
    if (hideInstall.value) {
      return
    }
    if (!showInstallPrompt.value || !deferredPrompt.value) {
      showInstallPrompt.value = false
      return
    }

    showInstallPrompt.value = false
    deferredPrompt.value.prompt()
    await deferredPrompt.value.userChoice
  })
  let cancelInstall = $(() => {
    if (hideInstall.value) {
      return
    }
    deferredPrompt.value = null
    showInstallPrompt.value = false
    window.removeEventListener('beforeinstallprompt', beforeInstallPrompt.value!)
    hideInstall.value = true
    localStorage.setItem(installPromptKey, 'true')
  })

  useOnWindow('load', $(async () => {
    debugger
    // https://thomashunter.name/posts/2021-12-11-detecting-if-pwa-twa-is-installed
    const ua = navigator.userAgent
    const ios = ua.match(/iPhone|iPad|iPod/)
    const useDisplay = webManifest.display === 'standalone' || webManifest.display === 'minimal-ui' ? `${webManifest.display}` : 'standalone'
    const standalone = window.matchMedia(`(display-mode: ${useDisplay})`).matches
    isPWAInstalled.value = !!(standalone || (ios && !ua.match(/Safari/)))
    hideInstall.value = localStorage.getItem(installPromptKey) === 'true'

    window.matchMedia(`(display-mode: ${useDisplay})`).addEventListener('change', (e) => {
      // PWA on fullscreen mode will not match standalone nor minimal-ui
      if (!isPWAInstalled.value && e.matches)
        isPWAInstalled.value = true
    })

    const registrations = await navigator.serviceWorker.getRegistrations()
    swRegistration.value = noSerialize(registrations.find((r) => {
      if (!r.active?.scriptURL) {
        return false
      }
      const url = new URL(r.active?.scriptURL)
      if (url.pathname === '/service-worker.js') {
        return true
      }
    }))

    swRegistration.value?.installing?.addEventListener('statechange', (e) => {
      swActivated.value = (e.target as ServiceWorker).state === 'activated'
    })

    ;(await navigator.serviceWorker.getRegistrations()).forEach((registration) => {
      registration.addEventListener('statechange', (e) => {
        console.log('state', e)
      })
    })

    if (!hideInstall.value) {
      beforeInstallPrompt.value = noSerialize<EventListener>((e: Event) => {
        e.preventDefault()
        deferredPrompt.value = noSerialize(e as InstallPromptEvent)
        showInstallPrompt.value = true
      })
      window.addEventListener('beforeinstallprompt', beforeInstallPrompt.value!)

      window.addEventListener('appinstalled', () => {
        deferredPrompt.value = null
        showInstallPrompt.value = false
      })
    }
  }))

  const cancelPrompt = $(() => {

  })

  return {
    registrationError,
    swActivated,
    showInstallPrompt,
    hideInstall,
    isPWAInstalled,
    install,
    cancelInstall,
    cancelPrompt
  }
}

type InstallPromptEvent = Event & {
  prompt: () => void
  userChoice: Promise<{ outcome: 'dismissed' | 'accepted' }>
}

