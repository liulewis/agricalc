// Agricalc Weather API Integration
// Uses Open-Meteo (free, no API key, CORS enabled) + IP-API (free geolocation)

var AgricalcWeather = (function() {
    var userLocation = null;
    var weatherData = null;
    
    // Get user location via IP geolocation (free, no key)
    function getUserLocation(callback) {
        if (userLocation) {
            callback(userLocation);
            return;
        }
        // Try browser geolocation first
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(pos) {
                    userLocation = {
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                        city: 'Your Location',
                        source: 'gps'
                    };
                    callback(userLocation);
                },
                function() {
                    // Fallback to IP geolocation
                    fetch('https://ipapi.co/json/')
                        .then(r => r.json())
                        .then(data => {
                            if (data.latitude && data.longitude) {
                                userLocation = {
                                    lat: data.latitude,
                                    lon: data.longitude,
                                    city: data.city || data.region || 'Your Area',
                                    source: 'ip'
                                };
                            } else {
                                // Default to a central location
                                userLocation = { lat: 40.71, lon: -74.0, city: 'New York', source: 'default' };
                            }
                            callback(userLocation);
                        })
                        .catch(() => {
                            userLocation = { lat: 40.71, lon: -74.0, city: 'New York', source: 'default' };
                            callback(userLocation);
                        });
                },
                { timeout: 5000 }
            );
        } else {
            fetch('https://ipapi.co/json/')
                .then(r => r.json())
                .then(data => {
                    if (data.latitude && data.longitude) {
                        userLocation = { lat: data.latitude, lon: data.longitude, city: data.city || 'Your Area', source: 'ip' };
                    } else {
                        userLocation = { lat: 40.71, lon: -74.0, city: 'New York', source: 'default' };
                    }
                    callback(userLocation);
                })
                .catch(() => {
                    userLocation = { lat: 40.71, lon: -74.0, city: 'New York', source: 'default' };
                    callback(userLocation);
                });
        }
    }
    
    // Fetch weather data from Open-Meteo
    function fetchWeather(lat, lon, callback) {
        var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
            '&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m' +
            '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max' +
            '&timezone=auto&forecast_days=7';
        
        fetch(url)
            .then(r => r.json())
            .then(data => {
                weatherData = data;
                callback(data);
            })
            .catch(err => {
                console.error('Weather fetch error:', err);
                callback(null);
            });
    }
    
    // Fetch agricultural weather data (soil temp/moisture, ET0)
    function fetchAgriculturalWeather(lat, lon, callback) {
        var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
            '&hourly=soil_temperature_0cm,soil_temperature_6cm,soil_temperature_18cm,soil_temperature_54cm,' +
            'soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm,' +
            'et0_fao_evapotranspiration,vapour_pressure_deficit' +
            '&daily=et0_fao_evapotranspiration,precipitation_sum' +
            '&timezone=auto&forecast_days=7';
        
        fetch(url)
            .then(r => r.json())
            .then(data => callback(data))
            .catch(err => {
                console.error('Ag weather fetch error:', err);
                callback(null);
            });
    }
    
    // Weather code to description
    function getWeatherDescription(code) {
        var codes = {
            0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
            45: 'Fog', 48: 'Depositing rime fog',
            51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
            56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
            61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
            66: 'Light freezing rain', 67: 'Heavy freezing rain',
            71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
            80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
            85: 'Slight snow showers', 86: 'Heavy snow showers',
            95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
        };
        return codes[code] || 'Unknown';
    }
    
    // Weather code to emoji
    function getWeatherEmoji(code) {
        if (code === 0) return '☀️';
        if (code <= 2) return '🌤️';
        if (code === 3) return '☁️';
        if (code <= 48) return '🌫️';
        if (code <= 57) return '🌦️';
        if (code <= 67) return '🌧️';
        if (code <= 77) return '❄️';
        if (code <= 82) return '🌧️';
        if (code <= 86) return '🌨️';
        return '⛈️';
    }
    
    // Render simple weather widget
    function renderWeatherWidget(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        
        getUserLocation(function(loc) {
            fetchWeather(loc.lat, loc.lon, function(data) {
                if (!data) {
                    container.innerHTML = '<p style="color:#999;">Weather data unavailable</p>';
                    return;
                }
                
                var current = data.current;
                var daily = data.daily;
                var html = '<div class="weather-widget" style="background:linear-gradient(135deg,#e3f2fd,#bbdefb);border-radius:12px;padding:20px;">';
                
                // Header
                html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">';
                html += '<div><strong style="color:#1565c0;font-size:16px;">📍 ' + loc.city + '</strong></div>';
                html += '<div style="font-size:11px;color:#666;">Powered by Open-Meteo</div>';
                html += '</div>';
                
                // Current weather
                html += '<div style="display:flex;align-items:center;gap:15px;margin-bottom:15px;">';
                html += '<div style="font-size:48px;">' + getWeatherEmoji(current.weather_code) + '</div>';
                html += '<div>';
                html += '<div style="font-size:32px;font-weight:700;color:#1565c0;">' + Math.round(current.temperature_2m) + '°C</div>';
                html += '<div style="font-size:13px;color:#555;">' + getWeatherDescription(current.weather_code) + '</div>';
                html += '</div>';
                html += '<div style="margin-left:auto;font-size:12px;color:#555;text-align:right;">';
                html += '<div>💧 ' + current.relative_humidity_2m + '%</div>';
                html += '<div>🌬️ ' + current.wind_speed_10m + ' km/h</div>';
                html += '<div>🌧️ ' + current.precipitation + ' mm</div>';
                html += '</div>';
                html += '</div>';
                
                // 7-day forecast
                html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;text-align:center;">';
                var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                for (var i = 0; i < 7; i++) {
                    var date = new Date(daily.time[i]);
                    var dayName = days[date.getDay()];
                    html += '<div style="padding:8px 4px;background:rgba(255,255,255,0.5);border-radius:8px;">';
                    html += '<div style="font-size:11px;font-weight:600;color:#1565c0;">' + (i === 0 ? 'Today' : dayName) + '</div>';
                    html += '<div style="font-size:20px;margin:4px 0;">' + getWeatherEmoji(daily.weather_code[i]) + '</div>';
                    html += '<div style="font-size:12px;font-weight:600;color:#333;">' + Math.round(daily.temperature_2m_max[i]) + '°</div>';
                    html += '<div style="font-size:11px;color:#888;">' + Math.round(daily.temperature_2m_min[i]) + '°</div>';
                    if (daily.precipitation_probability_max[i] > 0) {
                        html += '<div style="font-size:10px;color:#1976d2;">💧' + daily.precipitation_probability_max[i] + '%</div>';
                    }
                    html += '</div>';
                }
                html += '</div>';
                
                html += '</div>';
                container.innerHTML = html;
            });
        });
    }
    
    // Render agricultural weather dashboard
    function renderAgWeatherDashboard(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        
        getUserLocation(function(loc) {
            fetchAgriculturalWeather(loc.lat, loc.lon, function(data) {
                if (!data) {
                    container.innerHTML = '<p style="color:#999;">Agricultural weather data unavailable</p>';
                    return;
                }
                
                var hourly = data.hourly;
                var daily = data.daily;
                var now = new Date();
                var currentHour = now.getHours();
                
                var html = '<div class="ag-weather-dashboard" style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border-radius:12px;padding:20px;margin-top:20px;">';
                html += '<h4 style="color:#2e7d32;margin-bottom:15px;">🌱 Agricultural Weather Dashboard</h4>';
                html += '<p style="font-size:12px;color:#555;margin-bottom:15px;">📍 ' + loc.city + ' | Real-time soil & crop conditions</p>';
                
                // Soil temperatures at different depths
                html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:15px;">';
                var depths = [
                    { label: 'Surface (0cm)', temp: hourly.soil_temperature_0cm[currentHour] },
                    { label: 'Shallow (6cm)', temp: hourly.soil_temperature_6cm[currentHour] },
                    { label: 'Medium (18cm)', temp: hourly.soil_temperature_18cm[currentHour] },
                    { label: 'Deep (54cm)', temp: hourly.soil_temperature_54cm[currentHour] }
                ];
                depths.forEach(function(d) {
                    var status = d.temp > 10 ? '✅ Good' : d.temp > 5 ? '⚠️ Cool' : '❄️ Cold';
                    html += '<div style="background:white;padding:12px;border-radius:8px;text-align:center;">';
                    html += '<div style="font-size:11px;color:#666;">' + d.label + '</div>';
                    html += '<div style="font-size:24px;font-weight:700;color:#2e7d32;">' + d.temp.toFixed(1) + '°C</div>';
                    html += '<div style="font-size:10px;color:#888;">' + status + '</div>';
                    html += '</div>';
                });
                html += '</div>';
                
                // Soil moisture
                html += '<div style="background:white;padding:15px;border-radius:8px;margin-bottom:15px;">';
                html += '<div style="font-weight:600;color:#2e7d32;margin-bottom:10px;">💧 Soil Moisture Profile</div>';
                var moistureLayers = [
                    { label: 'Top (0-1cm)', value: hourly.soil_moisture_0_to_1cm[currentHour] },
                    { label: 'Upper (1-3cm)', value: hourly.soil_moisture_1_to_3cm[currentHour] },
                    { label: 'Middle (3-9cm)', value: hourly.soil_moisture_3_to_9cm[currentHour] },
                    { label: 'Lower (9-27cm)', value: hourly.soil_moisture_9_to_27cm[currentHour] }
                ];
                moistureLayers.forEach(function(m) {
                    var pct = Math.min(100, m.value * 20);
                    var color = pct > 50 ? '#4caf50' : pct > 25 ? '#ff9800' : '#f44336';
                    html += '<div style="margin-bottom:8px;">';
                    html += '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">';
                    html += '<span>' + m.label + '</span><span style="font-weight:600;">' + m.value.toFixed(2) + ' m³/m³</span>';
                    html += '</div>';
                    html += '<div style="background:#e0e0e0;border-radius:4px;height:8px;overflow:hidden;">';
                    html += '<div style="width:' + pct + '%;height:100%;background:' + color + ';border-radius:4px;transition:width .5s;"></div>';
                    html += '</div></div>';
                });
                html += '</div>';
                
                // ET0 and VPD
                html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
                html += '<div style="background:white;padding:12px;border-radius:8px;text-align:center;">';
                html += '<div style="font-size:11px;color:#666;">ET₀ Reference ET</div>';
                html += '<div style="font-size:22px;font-weight:700;color:#1976d2;">' + daily.et0_fao_evapotranspiration[0].toFixed(2) + ' mm</div>';
                html += '<div style="font-size:10px;color:#888;">Today\'s crop water demand</div>';
                html += '</div>';
                html += '<div style="background:white;padding:12px;border-radius:8px;text-align:center;">';
                html += '<div style="font-size:11px;color:#666;">Vapour Pressure Deficit</div>';
                html += '<div style="font-size:22px;font-weight:700;color:#e65100;">' + hourly.vapour_pressure_deficit[currentHour].toFixed(2) + ' kPa</div>';
                html += '<div style="font-size:10px;color:#888;">Plant transpiration indicator</div>';
                html += '</div>';
                html += '</div>';
                
                // 7-day ET0 forecast
                html += '<div style="margin-top:15px;background:white;padding:12px;border-radius:8px;">';
                html += '<div style="font-weight:600;color:#2e7d32;margin-bottom:8px;font-size:13px;">📊 7-Day Water Demand (ET₀ + Rain)</div>';
                html += '<div style="display:flex;align-items:flex-end;gap:4px;height:60px;">';
                for (var i = 0; i < 7; i++) {
                    var et0 = daily.et0_fao_evapotranspiration[i];
                    var rain = daily.precipitation_sum[i];
                    var net = Math.max(0, et0 - rain);
                    var maxEt0 = Math.max.apply(null, daily.et0_fao_evapotranspiration);
                    var h = (net / maxEt0) * 50 + 5;
                    var dayNames = ['S','M','T','W','T','F','S'];
                    var d = new Date(daily.time[i]);
                    html += '<div style="flex:1;text-align:center;">';
                    html += '<div style="font-size:9px;color:#666;margin-bottom:2px;">' + net.toFixed(1) + '</div>';
                    html += '<div style="background:' + (rain > et0 ? '#4caf50' : '#1976d2') + ';height:' + h + 'px;border-radius:3px 3px 0 0;"></div>';
                    html += '<div style="font-size:9px;color:#888;margin-top:2px;">' + dayNames[d.getDay()] + '</div>';
                    html += '</div>';
                }
                html += '</div></div>';
                
                html += '</div>';
                container.innerHTML = html;
            });
        });
    }
    
    // Get farming advice based on weather
    function getFarmingAdvice(callback) {
        getUserLocation(function(loc) {
            fetchWeather(loc.lat, loc.lon, function(data) {
                if (!data) { callback([]); return; }
                
                var current = data.current;
                var daily = data.daily;
                var advice = [];
                
                // Temperature advice
                if (current.temperature_2m < 5) {
                    advice.push({ icon: '❄️', title: 'Frost Risk', text: 'Temperatures below 5°C. Protect sensitive crops with row covers or delay planting.', priority: 'high' });
                } else if (current.temperature_2m > 35) {
                    advice.push({ icon: '🔥', title: 'Heat Stress', text: 'Extreme heat detected. Irrigate during cool hours and provide shade for sensitive crops.', priority: 'high' });
                }
                
                // Rain advice
                var rainToday = daily.precipitation_sum[0];
                var rainTomorrow = daily.precipitation_sum[1];
                if (rainToday > 10) {
                    advice.push({ icon: '🌧️', title: 'Heavy Rain Today', text: rainToday.toFixed(1) + 'mm expected. Delay fertilizer application and pesticide spraying.', priority: 'high' });
                } else if (rainTomorrow > 10 && rainToday < 2) {
                    advice.push({ icon: '📅', title: 'Rain Tomorrow', text: rainTomorrow.toFixed(1) + 'mm expected tomorrow. Today is ideal for field work before rain.', priority: 'medium' });
                } else if (rainToday < 1 && daily.precipitation_probability_max[0] < 20) {
                    advice.push({ icon: '✅', title: 'Good Field Conditions', text: 'Dry weather with low rain probability. Ideal for spraying, harvesting, or field work.', priority: 'low' });
                }
                
                // Wind advice
                if (current.wind_speed_10m > 30) {
                    advice.push({ icon: '💨', title: 'High Wind', text: 'Wind speed ' + current.wind_speed_10m + ' km/h. Avoid spraying (drift risk) and secure equipment.', priority: 'high' });
                } else if (current.wind_speed_10m > 15) {
                    advice.push({ icon: '🌬️', title: 'Moderate Wind', text: 'Wind ' + current.wind_speed_10m + ' km/h. Use low-drift nozzles if spraying.', priority: 'medium' });
                }
                
                // Humidity advice
                if (current.relative_humidity_2m > 90) {
                    advice.push({ icon: '🍄', title: 'High Humidity', text: 'Humidity ' + current.relative_humidity_2m + '%. Increased disease risk. Monitor for fungal infections.', priority: 'medium' });
                }
                
                // 3-day outlook
                var dryDays = 0;
                for (var i = 0; i < 3; i++) {
                    if (daily.precipitation_sum[i] < 2) dryDays++;
                }
                if (dryDays >= 2) {
                    advice.push({ icon: '📋', title: '3-Day Dry Window', text: dryDays + ' dry days ahead. Plan irrigation scheduling and field operations.', priority: 'low' });
                }
                
                callback(advice);
            });
        });
    }
    
    // Render farming advice widget
    function renderFarmingAdvice(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '<p style="color:#666;">Loading farming advice...</p>';
        
        getFarmingAdvice(function(advice) {
            if (advice.length === 0) {
                container.innerHTML = '<p style="color:#666;">No specific advice for current conditions.</p>';
                return;
            }
            
            var html = '<div class="farming-advice" style="margin-top:20px;">';
            html += '<h4 style="color:#2e7d32;margin-bottom:15px;">🌾 Smart Farming Advice</h4>';
            html += '<div style="display:grid;gap:10px;">';
            
            advice.forEach(function(a) {
                var bgColor = a.priority === 'high' ? '#ffebee' : a.priority === 'medium' ? '#fff3e0' : '#e8f5e9';
                var borderColor = a.priority === 'high' ? '#ef5350' : a.priority === 'medium' ? '#ff9800' : '#66bb6a';
                html += '<div style="padding:12px 15px;background:' + bgColor + ';border-left:4px solid ' + borderColor + ';border-radius:0 8px 8px 0;">';
                html += '<div style="font-weight:600;color:#333;margin-bottom:3px;">' + a.icon + ' ' + a.title + '</div>';
                html += '<div style="font-size:13px;color:#555;">' + a.text + '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            html += '<p style="font-size:11px;color:#999;margin-top:10px;">Advice generated from real-time weather data by Open-Meteo</p>';
            html += '</div>';
            container.innerHTML = html;
        });
    }
    
    return {
        renderWeatherWidget: renderWeatherWidget,
        renderAgWeatherDashboard: renderAgWeatherDashboard,
        renderFarmingAdvice: renderFarmingAdvice,
        getFarmingAdvice: getFarmingAdvice,
        getUserLocation: getUserLocation
    };
})();
