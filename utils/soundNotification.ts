/**
 * Rahatsız etmeyen yumuşak bir bildirim sesi çalar
 * Web Audio API kullanarak programatik olarak oluşturulur
 */
export const playNotificationSound = () => {
  try {
    // Web Audio API context oluştur
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Yumuşak, kısa bir bildirim sesi için osilatör oluştur
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Ses özellikleri - yumuşak ve rahatsız etmeyen
    oscillator.type = 'sine'; // Sine dalgası en yumuşak ses
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Orta ton
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1); // Hafif yükseliş
    
    // Ses seviyesi - düşük ve rahatsız etmeyen
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.05); // Yumuşak başlangıç
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3); // Yumuşak bitiş
    
    // Bağlantıları yap
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Kısa süreli çal (300ms)
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    // Context'i temizle
    oscillator.onended = () => {
      audioContext.close();
    };
  } catch (error) {
    // Eğer Web Audio API desteklenmiyorsa sessizce geç
    console.warn('Ses bildirimi çalınamadı:', error);
  }
};
