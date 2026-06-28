import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBHWCrFDsuMLxbKmFMQPbMJGBtohzeqqUk",
  authDomain: "iraqi-drug-guide-38aa5.firebaseapp.com",
  projectId: "iraqi-drug-guide-38aa5",
  storageBucket: "iraqi-drug-guide-38aa5.firebasestorage.app",
  messagingSenderId: "457879362257",
  appId: "1:457879362257:web:5e7b517acd09dc0d2203f0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const drugList = document.getElementById("drugList");
const search = document.getElementById("search");

let drugs = [];          // هنا تُحفظ الأدوية الأصلية القادمة من السيرفر
let filteredDrugs = [];  // هنا تُحفظ الأدوية المفلترة الحالية (مهمة جداً للـ Popup)
let currentCategory = "الكل";

async function loadDrugs() {
    try {
        const snapshot = await getDocs(collection(db, "drugs"));
        drugs = [];
        snapshot.forEach(doc => {
            drugs.push({ id: doc.id, ...doc.data() });
        });
        displayDrugs(drugs);
    } catch (error) {
        console.error("خطأ في جلب الأدوية: ", error);
    }
}

function displayDrugs(list) {
    drugList.innerHTML = "";
    
    // 1. الفرز حسب القسم المختار
    if (currentCategory !== "الكل") {
        filteredDrugs = list.filter(d => d.category === currentCategory);
    } else {
        filteredDrugs = list;
    }

    if(filteredDrugs.length === 0) {
        drugList.innerHTML = `<p style="text-align:center; color:#94a3b8; margin-top:20px;">لا توجد أدوية متوفرة في هذا القسم حالياً 🔎</p>`;
        return;
    }

    // 2. طباعة الأدوية بربطها مع حدث الضغط (onclick) لفتح الـ Popup
    filteredDrugs.forEach((drug, index) => {
        let imgUrl = drug.image;
        if (!imgUrl || imgUrl.includes("unsplash") || imgUrl.includes("ai")) {
            imgUrl = "https://cdn-icons-png.flaticon.com/512/883/883360.png"; 
        }

        const companyStr = drug.company ? `🏢 الشركة: ${drug.company}` : '';
        const strengthStr = drug.strength ? ` | الجرعة: ${drug.strength}` : '';

        drugList.innerHTML += `
        <div class="drug-card" onclick="openDetails(${index})">
            <img class="drug-img" src="${imgUrl}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/883/883360.png'">
            <div class="drug-info">
                <h3>${drug.name}</h3>
                <p style="color:#2563eb; font-weight:600;">${drug.scientific || 'مادة غير مسجلة'}</p>
                <p style="font-size:0.8rem; color:#64748b;">${companyStr} ${strengthStr}</p>
                <span style="background:#e0f2fe; color:#0369a1; font-size:0.75rem; padding:2px 8px; border-radius:10px; font-weight:bold;">${drug.category || 'أخرى'}</span>
            </div>
        </div>`;
    });
}

// دالة تصفية الأقسام الطبية
window.filterCategory = function(catName) {
    currentCategory = catName;
    
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => {
        if(btn.innerText.includes(catName) || (catName === 'الكل' && btn.innerText.includes('الكل'))) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    displayDrugs(drugs);
}

// البحث الذكي بالاسم أو المادة العلمية
search.addEventListener("input", () => {
    const value = search.value.toLowerCase();
    const filtered = drugs.filter(d =>
        (d.name && d.name.toLowerCase().includes(value)) ||
        (d.scientific && d.scientific.toLowerCase().includes(value))
    );
    displayDrugs(filtered);
});

// دالة فتح نافذة الشرح المطور (Popup) عند الضغط على أي كارت دواء
window.openDetails = function(index) {
    const drug = filteredDrugs[index]; // استخدام القائمة المفلترة لتفادي الأخطاء
    const modal = document.getElementById("drugModal");
    const modalData = document.getElementById("modalData");

    let imgUrl = drug.image;
    if (!imgUrl || imgUrl.includes("unsplash") || imgUrl.includes("ai")) {
        imgUrl = "https://cdn-icons-png.flaticon.com/512/883/883360.png"; 
    }

    modalData.innerHTML = `
        <div class="modal-header">
            <img src="${imgUrl}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/883/883360.png'">
            <h2 style="color:#1e3a8a; margin-top:10px;">${drug.name}</h2>
            <p style="color:#2563eb; font-weight:bold; font-size:1.1rem;">${drug.scientific || 'غير مسجل'}</p>
        </div>
        <div class="detail-item"><strong>🏢 الشركة المصنعة:</strong> ${drug.company || 'غير محددة'}</div>
        <div class="detail-item"><strong>⚖️ الجرعة الطبية:</strong> ${drug.strength || 'غير محددة'}</div>
        <div class="detail-item"><strong>📁 القسم والتصنيف الطبي:</strong> ${drug.category || 'أخرى'}</div>
        <div class="detail-item"><strong>📝 تفاصيل واستعمالات الدواء:</strong> ${drug.description || 'لا يوجد شرح مفصل مضاف حالياً. يمكنك إضافة الشرح من لوحة تحكم الأدمن.'}</div>
    `;
    modal.style.display = "flex";
}

// دالة إغلاق نافذة الشرح
window.closeModal = () => {
    document.getElementById("drugModal").style.display = "none";
}

// تشغيل جلب البيانات عند فتح التطبيق
loadDrugs();
