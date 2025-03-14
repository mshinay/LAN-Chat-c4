import { ref, computed, onMounted, onUnmounted } from 'vue'
const useMobile = () => {
    const windowWidth = ref(window.innerWidth)
    const isMobile = computed(() => windowWidth.value < 768)
    const handleResize = () => {
        windowWidth.value = window.innerWidth
    }
    onMounted(() => {
        window.addEventListener('resize', handleResize)
    })
    onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
    })
    return isMobile
}
export default useMobile
