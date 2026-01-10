/**
 * Zil/çağrı sesi gibi bildirim sesi çalar
 * Web Audio API kullanarak programatik olarak oluşturulur
 * Birden fazla harmonik ile gerçekçi zil sesi efekti
 */
export const playNotificationSound = () => {
  try {
    // Web Audio API context oluştur
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;
    const duration = 0.6; // Biraz daha uzun zil sesi
    
    // Ana zil tonu için osilatörler (harmonikler ile zengin ses)
    const frequencies = [800, 1000, 1200]; // Üç farklı ton harmonik oluşturur
    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    
    frequencies.forEach((freq, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      // Zil sesi için daha uygun dalga tipi
      osc.type = index === 0 ? 'sine' : 'triangle'; // Ana ton sine, diğerleri triangle
      osc.frequency.setValueAtTime(freq, now);
      
      // Zil sesi envelope - hızlı attack, yavaş decay
      const attackTime = 0.05;
      const decayTime = duration - attackTime;
      const maxGain = index === 0 ? 0.25 : 0.15; // Ana ton daha yüksek
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(maxGain, now + attackTime); // Hızlı başlangıç
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration); // Yavaş sönüş (zil efekti)
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      oscillators.push(osc);
      gainNodes.push(gain);
    });
    
    // İkinci bir zil vuruşu ekle (kısa bir süre sonra - daha gerçekçi)
    setTimeout(() => {
      try {
        const secondNow = audioContext.currentTime;
        const shortFreqs = [900, 1100]; // Daha kısa ikinci vuruş
        
        shortFreqs.forEach((freq, index) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, secondNow);
          
          const shortDuration = 0.3;
          gain.gain.setValueAtTime(0, secondNow);
          gain.gain.linearRampToValueAtTime(0.12, secondNow + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.01, secondNow + shortDuration);
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.start(secondNow);
          osc.stop(secondNow + shortDuration);
        });
      } catch (e) {
        // İkinci vuruş hatası önemli değil
      }
    }, 200);
    
    // Ana osilatörleri başlat
    oscillators.forEach(osc => {
      osc.start(now);
      osc.stop(now + duration);
    });
    
    // Context'i temizle
    setTimeout(() => {
      try {
        audioContext.close();
      } catch (e) {
        // Context zaten kapanmış olabilir
      }
    }, (duration + 0.5) * 1000);
    
  } catch (error) {
    // Eğer Web Audio API desteklenmiyorsa sessizce geç
    console.warn('Ses bildirimi çalınamadı:', error);
  }
};
