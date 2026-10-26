import { afterEach, beforeEach, describe, it, expect, vi } from 'vite-plus/test'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../App.vue'

vi.mock('@/lib/storage', () => ({
  loadDraft: vi.fn().mockResolvedValue(null),
  saveDraft: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => vi.unstubAllGlobals())

describe('App', () => {
  it('renders the branded editor and disables exports before input', async () => {
    const wrapper = mount(App)
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('MAKE YOUR QR YOURS.')
    expect(wrapper.get('button.primary-button').attributes('disabled')).toBeDefined()
    expect(wrapper.get('input[type="url"]').attributes('placeholder')).toBe('https://example.com')

    wrapper.unmount()
  })

  it('switches to text input and explains invalid URL input', async () => {
    const wrapper = mount(App)
    await flushPromises()

    await wrapper.get('input[type="url"]').setValue('not a URL')
    await wrapper.get('input[type="url"]').trigger('blur')
    expect(wrapper.get('#input-hint').text()).toContain('https://')

    const textButton = wrapper.findAll('.input-tabs button')[1]!
    await textButton.trigger('click')

    expect(wrapper.get('textarea').element.value).toBe('not a URL')
    expect(textButton.attributes('aria-pressed')).toBe('true')

    wrapper.unmount()
  })
})
