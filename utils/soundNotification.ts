/**
 * Restoran çan sesi gibi bildirim sesi çalar
 * Şeflerin sipariş hazır olduğunda bastığı "ding-ding-ding" sesi gibi
 * Web Audio API kullanarak programatik olarak oluşturulur
 */
export const playNotificationSound = () => {
  try {
    // Web Audio API context oluştur
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Çan vuruşları - 3 kez çalacak (ding-ding-ding)
    const bellStrikes = 3;
    const strikeInterval = 150; // Her vuruş arası 150ms
    const strikeDuration = 0.2; // Her vuruş 200ms
    
    for (let i = 0; i < bellStrikes; i++) {
      const delay = i * strikeInterval;
      
      setTimeout(() => {
        try {
          const now = audioContext.currentTime;
          
          // Çan sesi için metalik ton - birden fazla harmonik
          const baseFreq = 880; // A5 notası - klasik çan tonu
          const harmonics = [
            { freq: baseFreq, gain: 0.3, type: 'sine' },      // Ana ton
            { freq: baseFreq * 2, gain: 0.2, type: 'sine' },  // Oktav
            { freq: baseFreq * 3, gain: 0.15, type: 'triangle' }, // Üçüncü harmonik
            { freq: baseFreq * 4.5, gain: 0.1, type: 'sawtooth' } // Metalik tını için
          ];
          
          harmonics.forEach((harmonic, index) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = harmonic.type as OscillatorType;
            osc.frequency.setValueAtTime(harmonic.freq, now);
            
            // Keskin attack, hızlı decay - çan karakteristiği
            const attackTime = 0.01; // Çok hızlı başlangıç
            const decayTime = strikeDuration - attackTime;
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(harmonic.gain, now + attackTime);
            gain.gain.exponentialRampToValueAtTime(0.001, now + strikeDuration);
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.start(now);
            osc.stop(now + strikeDuration);
          });
        } catch (e) {
          // Tek bir vuruş hatası önemli değil
        }
      }, delay);
    }
    
    // Context'i temizle (tüm vuruşlar bittikten sonra)
    setTimeout(() => {
      try {
        audioContext.close();
      } catch (e) {
        // Context zaten kapanmış olabilir
      }
    }, (bellStrikes * strikeInterval) + (strikeDuration * 1000) + 100);
    
  } catch (error) {
    // Eğer Web Audio API desteklenmiyorsa sessizce geç
    console.warn('Ses bildirimi çalınamadı:', error);
  }
};
