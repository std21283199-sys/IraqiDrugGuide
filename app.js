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

let fetchedDrugs = [];

// ⚖️ دالة التحقق من ظهور التحذير القانوني لمرة واحدة فقط
function checkDisclaimer() {
    const isAccepted = localStorage.getItem("drugGuideDisclaimerAccepted");
    if (!isAccepted) {
        document.getElementById("disclaimerOverlay").classList.add("show");
    }
}

window.acceptDisclaimer = function() {
    localStorage.setItem("drugGuideDisclaimerAccepted", "true");
    document.getElementById("disclaimerOverlay").classList.remove("show");
}

// دالة مساعدة لفك تغليف حقول الفايربيس المستلمة عبر الـ REST API
function getProp(field, fallback = "-") {
    if (!field) return fallback;
    if (typeof field === "object" && field.stringValue !== undefined) {
        return field.stringValue;
    }
    return field;
}

// 1️⃣ جلب وعرض الأدوية وتوليد الأقسام ديناميكياً من السيرفر
async function getDrugsFromFirebase() {
    const container = document.getElementById("drugsContainer");
    container.innerHTML = "<p style='color:#8fa0c0; text-align:center; padding:20px;'>جاري تحميل دليل الأدوية الملكي... ⏳</p>";
    
    try {
        const querySnapshot = await getDocs(collection(db, "drugs"));
        fetchedDrugs = [];
        
        const categoriesSet = new Set();
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedDrugs.push({ id: doc.id, ...data });
            
            const catVal = getProp(data.category, "أخرى");
            if (catVal && catVal.trim() !== "") {
                categoriesSet.add(catVal.trim());
            }
        });
        
        // توليد أزرار المجموعات الديناميكية وحذف القديمة الثابتة
        renderCategoryChips(Array.from(categoriesSet));
        
        renderDrugsList(fetchedDrugs);
    } catch (error) {
        container.innerHTML = "<p style='color:red; text-align:center;'>فشل جلب البيانات. تأكد من اتصال الإنترنت مالتك.</p>";
        console.error(error);
    }
}

// 🎯 دالة توليد الأقسام الديناميكية الجديدة وحذف شريط الأزرار العلوي القديم كلياً
function renderCategoryChips(categoriesArray) {
    // 1. إخفاء أو حذف الحاوية القديمة الفوق بالكامل إذا كانت موجودة في الـ HTML
    const oldContainer = document.querySelector(".categories-container") || 
                         document.querySelector(".categories-nav") || 
                         document.getElementById("categoriesContainer");
    if (oldContainer && oldContainer.id !== "dynamicCategoriesContainer") {
        oldContainer.style.display = "none"; // إخفاء الشريط القديم كلياً لمنع ظهوره الفوق
    }

    // 2. استهداف أو إنشاء حاوية الأقسام الجديدة تحت حقل البحث مباشرة
    let filterContainer = document.getElementById("dynamicCategoriesContainer");
    if (!filterContainer) {
        filterContainer = document.createElement("div");
        filterContainer.id = "dynamicCategoriesContainer";
        
        // وضع الحاوية تحت حقل البحث أو عنوان "أحدث الإضافات" بشكل متناسق
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.parentNode.insertBefore(filterContainer, searchInput.nextSibling);
        } else {
            const drugsContainer = document.getElementById("drugsContainer");
            drugsContainer.parentNode.insertBefore(filterContainer, drugsContainer);
        }
    }

    // تنظيف الحاوية الديناميكية قبل الحقن لمنع التكرار عند التحديث
    filterContainer.innerHTML = "";

    // تفعيل خاصية السحب الأفقي الاحترافي والتنسيق البصري الفخم للموبايل
    filterContainer.style.display = "flex";
    filterContainer.style.overflowX = "auto";
    filterContainer.style.whiteSpace = "nowrap";
    filterContainer.style.gap = "10px";
    filterContainer.style.padding = "12px 5px";
    filterContainer.style.margin = "10px 0";
    filterContainer.style.webkitOverflowScrolling = "touch";

    // أ. إضافة زر الكل المطور في بداية الشريط الجديد
    const allBtn = document.createElement("button");
    allBtn.className = "cat-chip active";
    allBtn.innerHTML = "💊 الكل";
    allBtn.addEventListener("click", (e) => filterCategory('الكل', e));
    filterContainer.appendChild(allBtn);
    
    // ب. إضافة كافة الأقسام الفعالة المستلمة من السيرفر مرتبة أبجدياً
    categoriesArray.sort().forEach(category => {
        if (category !== "أخرى" && category.trim() !== "") {
            const btn = document.createElement("button");
            btn.className = "cat-chip";
            btn.innerText = category;
            btn.addEventListener("click", (e) => filterCategory(category, e));
            filterContainer.appendChild(btn);
        }
    });
    
    // جـ. إضافة قسم أخرى في نهاية الشريط دائماً
    if (categoriesArray.includes("أخرى")) {
        const otherBtn = document.createElement("button");
        otherBtn.className = "cat-chip";
        otherBtn.innerText = "أخرى";
        otherBtn.addEventListener("click", (e) => filterCategory('أخرى', e));
        filterContainer.appendChild(otherBtn);
    }
}

// 2️⃣ دالة طباعة الأدوية بداخل الواجهة الرئيسية
function renderDrugsList(drugsArray) {
    const container = document.getElementById("drugsContainer");
    container.innerHTML = "";
    
    if(drugsArray.length === 0) {
        container.innerHTML = "<p style='color:#8fa0c0; text-align:center; padding:20px;'>لم يتم العثور على أدوية مطابقة 🔍</p>";
        return;
    }

    const defaultPlaceholderImage = "https://cdn-icons-png.flaticon.com/512/883/883360.png";

    drugsArray.forEach((drug) => {
        const card = document.createElement("div");
        card.className = "drug-card";
        
        const nameVal = getProp(drug.name, "بدون اسم");
        const sciVal = getProp(drug.scientific, "المادة العلمية غير محددة");
        const compVal = getProp(drug.company, "غير محددة");
        const strengthVal = getProp(drug.strength, "غير محددة");
        const catVal = getProp(drug.category, "أخرى");
        const imageVal = getProp(drug.image, "");

        let firstImgUrl = defaultPlaceholderImage;
        if (imageVal && imageVal.trim() !== "") {
            const imagesArray = imageVal.split(","); 
            firstImgUrl = imagesArray[0].trim(); 
        }

        const imgHTML = `<img src="${firstImgUrl}" alt="${nameVal}" style="width: 55px; height: 55px; border-radius: 12px; object-fit: contain; border: 1.5px solid var(--gold-primary, #c5a86a); margin-left: 12px; flex-shrink: 0; background: #101c37; padding: 4px;">`;

        card.innerHTML = `
            ${imgHTML}
            <div class="drug-info" style="flex-grow: 1; text-align: right;">
                <div class="drug-title-row">
                    <span class="d-name" style="font-weight:700; color:#fff; font-size:1.05rem;">${nameVal}</span>
                </div>
                <span class="d-scientific" style="color: #5587e7; font-weight:600; display:block; font-size:0.85rem; margin-top:2px;">${sciVal}</span>
                <span class="d-meta" style="color: #8fa0c0; font-size:0.75rem; display:block; margin-top:2px;">الشركة: ${compVal} | الجرعة: ${strengthVal}</span>
                <div style="margin-top: 5px;"><span class="d-badge">${catVal}</span></div>
            </div>
            <div style="color: var(--gold-primary); font-size: 1rem; padding-right: 5px; opacity: 0.6;">◀</div>
        `;
        
        card.addEventListener("click", () => openDetailsModal(drug));
        container.appendChild(card);
    });
}

let currentImagesList = [];
let currentImageIndex = 0;

// 3️⃣ دالة فتح شاشة تفاصيل الدواء وعرض الألبوم
function openDetailsModal(drug) {
    document.getElementById("modalDrugName").innerText = getProp(drug.name, "لا يوجد اسم");
    document.getElementById("modalDrugScientific").innerText = getProp(drug.scientific, "-");
    document.getElementById("modalDrugStrength").innerText = getProp(drug.strength, "غير محدد");
    document.getElementById("modalDrugCompany").innerText = getProp(drug.company, "غير محدد");
    document.getElementById("modalDrugCategory").innerText = getProp(drug.category, "أخرى");

    document.getElementById("modalDrugIngredients").innerText = getProp(drug.ingredients, "-");
    document.getElementById("modalDrugDescription").innerText = getProp(drug.description, "-");
    document.getElementById("modalDrugSideEffects").innerText = getProp(drug.sideEffects, "-");
    document.getElementById("modalDrugWarnings").innerText = getProp(drug.warnings, "-");

    const defaultPlaceholder = "https://cdn-icons-png.flaticon.com/512/883/883360.png";
    currentImagesList = [];
    currentImageIndex = 0;

    const imageVal = getProp(drug.image, "");

    if (imageVal && imageVal.trim() !== "") {
        currentImagesList = imageVal.split(",").map(url => url.trim());
    } else {
        currentImagesList.push(defaultPlaceholder);
    }

    updateModalImage();
    document.getElementById("detailsOverlay").classList.add("open");
}

function updateModalImage() {
    const modalImg = document.getElementById("modalDrugImage");
    const activeUrl = currentImagesList[currentImageIndex];
    modalImg.src = activeUrl;
    modalImg.dataset.zoomUrl = activeUrl;

    let nextBtn = document.getElementById("nextImgBtn");
    let prevBtn = document.getElementById("prevImgBtn");

    if (!nextBtn && currentImagesList.length > 1) {
        const btnContainer = modalImg.parentElement;
        btnContainer.style.position = "relative";
        
        nextBtn = document.createElement("button");
        nextBtn.id = "nextImgBtn";
        nextBtn.innerText = "◀";
        nextBtn.style = "position:absolute; left:10px; top:50%; transform:translateY(-50%); background:rgba(197,168,106,0.8); border:none; color:#0d1527; width:30px; height:30px; border-radius:50%; font-weight:bold; cursor:pointer; z-index:10;";
        nextBtn.onclick = () => {
            currentImageIndex = (currentImageIndex + 1) % currentImagesList.length;
            updateModalImage();
        };
        
        prevBtn = document.createElement("button");
        prevBtn.id = "prevImgBtn";
        prevBtn.innerText = "▶";
        prevBtn.style = "position:absolute; right:10px; top:50%; transform:translateY(-50%); background:rgba(197,168,106,0.8); border:none; color:#0d1527; width:30px; height:30px; border-radius:50%; font-weight:bold; cursor:pointer; z-index:10;";
        prevBtn.onclick = () => {
            currentImageIndex = (currentImageIndex - 1 + currentImagesList.length) % currentImagesList.length;
            updateModalImage();
        };

        btnContainer.appendChild(nextBtn);
        btnContainer.appendChild(prevBtn);
    }

    if (currentImagesList.length <= 1) {
        if (nextBtn) nextBtn.remove();
        if (prevBtn) prevBtn.remove();
    }
}

window.closeDetailsModal = function() {
    document.getElementById("detailsOverlay").classList.remove("open");
    closeZoomedImage();
}

window.zoomImage = function() {
    const modalImg = document.getElementById("modalDrugImage");
    const zoomUrl = modalImg.dataset.zoomUrl;
    if(zoomUrl) {
        document.getElementById("zoomedImage").src = zoomUrl;
        document.getElementById("imageViewerOverlay").classList.add("open");
    }
}

window.closeZoomedImage = function() {
    document.getElementById("imageViewerOverlay").classList.remove("open");
}

document.getElementById("searchInput").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = fetchedDrugs.filter(drug => {
        const nameVal = getProp(drug.name, "").toLowerCase();
        const sciVal = getProp(drug.scientific, "").toLowerCase();
        return nameVal.includes(query) || sciVal.includes(query);
    });
    renderDrugsList(filtered);
});

// 🎯 دالة الفلترة الذكية للأقسام الديناميكية
window.filterCategory = function(categoryName, event) {
    const chips = document.querySelectorAll('.cat-chip');
    chips.forEach(chip => chip.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    } else if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    if(categoryName === 'الكل') {
        renderDrugsList(fetchedDrugs);
    } else {
        const filtered = fetchedDrugs.filter(drug => getProp(drug.category) === categoryName);
        renderDrugsList(filtered);
    }
}

checkDisclaimer();
getDrugsFromFirebase();
