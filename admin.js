// 🔒 جدار حماية لوحة الأدمن: منع الدخول التلقائي بدون تسجيل
function checkAdminAccess() {
    const isAdminLoggedIn = sessionStorage.getItem("adminLoggedIn");
    
    if (isAdminLoggedIn !== "true") {
        // إذا لم يسجل دخوله، نطلب الرمز السري فوراً
        const password = prompt("🔐 هذه المنطقة مخصصة للأدمن فقط. يرجى إدخال كلمة المرور للدخول:");
        
        // ضع كلمة المرور الخاصة بك هنا (مثلاً: 123456 أو admin2026)
        if (password === "824633557") { 
            sessionStorage.setItem("adminLoggedIn", "true");
            alert("✅ تم تسجيل الدخول بنجاح ملكنا! أهلاً بك في لوحة التحكم.");
        } else {
            alert("❌ كلمة المرور خاطئة! سيتم إعادتك للرئيسية.");
            window.location.href = "index.html"; // طرده وإعادته للرئيسية فوراً
        }
    }
}

// تشغيل جدار الحماية فوراً عند تحميل الصفحة لمنع ظهور أي تفاصيل
checkAdminAccess();

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

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
const auth = getAuth(app);

// عناصر الواجهة
const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelEdit = document.getElementById("cancelEdit");
const editList = document.getElementById("editList");
const formTitle = document.getElementById("formTitle");

// حقول الإدخال
const editDocId = document.getElementById("editDocId");
const drugName = document.getElementById("drugName");
const drugScientific = document.getElementById("drugScientific");
const drugCompany = document.getElementById("drugCompany");
const drugStrength = document.getElementById("drugStrength");
const drugCategory = document.getElementById("drugCategory");
const drugImage = document.getElementById("drugImage");
const drugDescription = document.getElementById("drugDescription");

let allDrugs = [];

// مراقبة تسجيل الدخول وحماية الصفحة
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add("hidden");
        adminSection.classList.remove("hidden");
        loadAdminDrugs(); 
        
        // تعديل نص وحالة الزر السحري بعد تسجيل الدخول بنجاح
        const magicBtn = document.getElementById("magicClassifyBtn");
        if (magicBtn) {
            magicBtn.innerText = "🧹 اضغط هنا لحذف المتكرر وتصنيف الأدوية فوراً 🧹";
            magicBtn.disabled = false;
            magicBtn.style.opacity = "1";
        }
    } else {
        loginSection.classList.remove("hidden");
        adminSection.classList.add("hidden");
    }
});

// دالة تسجيل الدخول
loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("تم تسجيل الدخول بنجاح! 🎉");
    } catch (error) {
        alert("خطأ في تسجيل الدخول! تأكد من البيانات.");
    }
});

// تسجيل الخروج
logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
});

// 1. دالة جلب وعرض الأدوية لغرض التعديل
async function loadAdminDrugs() {
    editList.innerHTML = "<p style='color:#777;'>جاري تحميل الأدوية للتعديل وفحص التصنيفات...</p>";
    try {
        const snapshot = await getDocs(collection(db, "drugs"));
        allDrugs = [];
        editList.innerHTML = "";
        
        snapshot.forEach(documentSnapshot => {
            const drugData = documentSnapshot.data();
            allDrugs.push({ id: documentSnapshot.id, ...drugData });
            
            let imgUrl = drugData.image || "https://cdn-icons-png.flaticon.com/512/883/883360.png";
            if(imgUrl.includes("unsplash")) imgUrl = "https://cdn-icons-png.flaticon.com/512/883/883360.png";

            const card = document.createElement("div");
            card.className = "edit-card";
            card.innerHTML = `
                <img src="${imgUrl}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/883/883360.png'">
                <div style="flex-grow:1;">
                    <strong>${drugData.name}</strong> <span style="font-size:0.8rem; color:#777;">(${drugData.strength || ''})</span>
                    <p style="margin:2px 0 0 0; font-size:0.85rem; color:#2563eb;">${drugData.scientific || ''}</p>
                    <span style="background:#f1f5f9; font-size:0.75rem; padding:1px 5px; border-radius:5px;">${drugData.category || 'أخرى'}</span>
                </div>
                <button style="width:auto; padding:5px 10px; margin:0; font-size:0.8rem; background:#3b82f6;">تعديل</button>
            `;
            
            card.addEventListener("click", () => startEdit(documentSnapshot.id, drugData));
            editList.appendChild(card);
        });
    } catch (error) {
        editList.innerHTML = "<p style='color:red;'>فشل تحميل قائمة الأدوية.</p>";
    }
}

// 2. دالة تجهيز الحقول للتعديل اليدوي
function startEdit(id, data) {
    formTitle.innerText = `✍️ تعديل دواء: ${data.name}`;
    editDocId.value = id;
    drugName.value = data.name || "";
    drugScientific.value = data.scientific || "";
    drugCompany.value = data.company || "";
    drugStrength.value = data.strength || "";
    drugCategory.value = data.category || "أخرى";
    drugDescription.value = data.description || "";
    drugImage.value = data.image && !data.image.includes("unsplash") ? data.image : "";
    
    cancelEdit.classList.remove("hidden");
    saveBtn.innerText = "تحديث التعديلات الحالية 💾";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

cancelEdit.addEventListener("click", resetForm);

function resetForm() {
    formTitle.innerText = "إضافة دواء جديد 🚀";
    editDocId.value = "";
    drugName.value = "";
    drugScientific.value = "";
    drugCompany.value = "";
    drugStrength.value = "";
    drugCategory.value = "الجهاز الهضمي";
    drugImage.value = "";
    drugDescription.value = "";
    cancelEdit.classList.add("hidden");
    saveBtn.innerText = "حفظ البيانات ✅";
}

// زر الحفظ والتعديل اليدوي
saveBtn.addEventListener("click", async () => {
    const id = editDocId.value;
    const drugData = {
        name: drugName.value,
        scientific: drugScientific.value,
        company: drugCompany.value,
        strength: drugStrength.value,
        category: drugCategory.value,
        image: drugImage.value || "https://cdn-icons-png.flaticon.com/512/883/883360.png",
        description: drugDescription.value
    };

    if (!drugData.name || !drugData.scientific) {
        alert("يرجى إدخال الاسم والمادة العلمية على الأقل! ⚠️");
        return;
    }

    try {
        if (id) {
            const docRef = doc(db, "drugs", id);
            await updateDoc(docRef, drugData);
            alert("✅ تم تحديث بيانات الدواء بنجاح في قاعدة البيانات!");
        } else {
            await addDoc(collection(db, "drugs"), drugData);
            alert("✅ تم إضافة دواء جديد كلياً!");
        }
        resetForm();
        loadAdminDrugs(); 
    } catch (error) {
        alert("حدث خطأ أثناء حفظ البيانات!");
    }
});

// ========================================================
// دالة الرفع والتنظيف والفرز التلقائي الموحدة
// ========================================================
async function cleanAndClassifyData() {
    if (!auth.currentUser) {
        alert("فشل التحديث؛ يرجى التأكد من تسجيل الدخول أولاً! ⚠️");
        return;
    }

    alert("جاري بدء فحص المتكرر وتحديث التصنيفات في السيرفر... يرجى الانتظار لحين ظهور رسالة النجاح ⏳");
    
    try {
        const snapshot = await getDocs(collection(db, "drugs"));
        
        const medicalMap = {
            "diamicron": { category: "الغدد والسكري", description: "علاج لمرض السكري من النوع الثاني، يساعد البنكرياس على إفراز الإنسولين بفعالية لتنظيم مستويات السكر في الدم والوقاية من مضاعفاته." },
            "glucophage": { category: "الغدد والسكري", description: "منظم السكر الشهير (ميتفورمين)، يزيد استجابة الجسم للإنسولين ويقلل إنتاج الجلوكوز بالمعدة." },
            "jardiance": { category: "الغدد والسكري", description: "علاج حديث للسكري يساعد الكلى على التخلص من السكر الزائد عن طريق البول، ويساهم في حماية القلب والشرايين." },
            "augmentin": { category: "المضادات الحيوية", description: "مضاد حيوي واسع الطيف يتكون من الأموكسيسيلين وحامض الكلافولانيك، يستخدم لعلاج التهابات الجهاز التنفسي، الأذن الوسطى، والمسالك البولية." },
            "panadol": { category: "المسكنات والحرارة", description: "مسكن للآلام الخفيفة والمتوسطة مثل الصداع وألم الأسنان، وخافض فعال للحرارة وحمى نزلات البرد." },
            "adol": { category: "المسكنات والحرارة", description: "يحتوي على الباراسيتامول، يستخدم كمسكن آمن للآلام وخافض للحرارة للكبار والأطفال." },
            "brufen": { category: "المسكنات والحرارة", description: "مضاد للالتهاب ومسكن للآلام وأوجاع المفاصل، الأسنان، وخافض للحرارة." },
            "voltaren": { category: "المسكنات والحرارة", description: "مسكن قوي ومضاد للالتهابات الروماتزمية، ألم العظام والمفاصل، والآلام الحادة." },
            "ponstan": { category: "المسكنات والحرارة", description: "يستخدم بشكل شائع لتسكين آلام الدورة الشهرية، ألم الأسنان، وآلام العضلات والعظام." },
            "plasil": { category: "الجهاز الهضمي", description: "مضاد للتقيؤ والغثيان، يعمل على تحريك عضلات الجهاز الهضمي العلوي لتسريع إفراغ المعدة." },
            "buscopan": { category: "الجهاز الهضمي", description: "مضاد للتقلصات والمغص، يعمل على إرخاء العضلات الملساء في الجهاز الهضمي والبولي لتخفيف الألم الحاد." },
            "duspatalin": { category: "الجهاز الهضمي", description: "مضاد لشنج القولون، يستخدم لعلاج أعراض متلازمة القولون العصبي (IBS) والآلام المصاحبة له." },
            "losec": { category: "الجهاز الهضمي", description: "مسبط لمضخة البروتون، يقلل إفراز أحماض المعدة لعلاج قرحة المعدة، الاثني عشر، وارتجاع المريء." },
            "gasec": { category: "الجهاز الهضمي", description: "يحتوي على أوميبرازول، لحماية المعدة وعلاج الحموضة الزائدة والارتجاع المريئي الحاد." },
            "nexium": { category: "الجهاز الهضمي", description: "علاج متطور لتقليل حامض المعدة، يعالج التهاب المريء الارتجاعي ويحمي من قرحة المعدة." },
            "motilium": { category: "الجهاز الهضمي", description: "منظم لحركة الأمعاء ومضاد للغثيان والتقيؤ والشعور بالامتلاء أو النفخة بعد الأكل." },
            "flagyl": { category: "المضادات الحيوية", description: "مضاد حيوي ومطهر فعال ضد البكتيريا اللاهوائية والطفيليات، يستخدم لعلاج إسهال الالتهابات المعوية." },
            "amoxil": { category: "المضادات الحيوية", description: "مضاد حيوي شهير لعلاج التهابات اللوزتين، الجيوب الأنفية، الصدر، والتهابات الجلد البكتيرية." },
            "zithromax": { category: "المضادات الحيوية", description: "مضاد حيوي يؤخذ ككورس قصير (3-5 أيام) لعلاج التهابات الجهاز التنفسي والبلعوم." },
            "cipro": { category: "المضادات الحيوية", description: "مضاد حيوي قوي يستخدم بشكل خاص لعلاج التهابات المسالك البولية الحادة والتهابات العظام." },
            "suprax": { category: "المضادات الحيوية", description: "مضاد حيوي من جيل متطور يستخدم لعلاج التهابات الصدر، الأذن الوسطى، والمسالك البولية." },
            "norvasc": { category: "القلب والأوعية", description: "يعمل على إرخاء الأوعية الدموية لخفض ضغط الدم المرتفع وتقليل نوبات الذبحة الصدرية." },
            "diovan": { category: "القلب والأوعية", description: "يستخدم لعلاج ضغط الدم المرتفع وحماية الكلى وحماية عضلة القلب بعد النوبات القلبية." },
            "tenormin": { category: "القلب والأوعية", description: "منظم لضربات القلب وخافض لضغط الدم المرتفع، ويقلل الجهد على عضلة القلب." },
            "lipitor": { category: "القلب والأوعية", description: "يستخدم لخفض نسبة الكوليسترول الضار والدهون الثلاثية في الدم للوقاية من الجلطات وأمراض القلب." },
            "plavix": { category: "القلب والأوعية", description: "مضاد لتجمع الصفيحات الدموية (مميع)، يمنع تكون الجلطات الدموية بالسكتات الدماغية والنوبات القلبية." },
            "concor": { category: "القلب والأوعية", description: "يتحكم بضغط الدم المرتفع وينظم نبضات القلب السريعة، ويخفف الحمل على القلب لحمايته." },
            "euthyrox": { category: "الغدد والسكري", description: "هرمون صناعي بديل لتعويض نقص إفراز الغدة الدرقية (خمول الغدة) لتنظيم عملية الأيض بالجسم." },
            "ventolin": { category: "الجهاز التنفسي", description: "موسع قصبات سريع المفعول (بخاخ أو شراب) يفتح الممرات الهوائية فوراً أثناء نوبات الربو وضيق التنفس." },
            "singulair": { category: "الجهاز التنفسي", description: "علاج وقائي يمنع نوبات الربو ويخفف من أعراض الحساسية الموسمية وحساسية الأنف المزمنة." },
            "clarityne": { category: "الجهاز التنفسي", description: "مضاد حساسية لا يسبب النعاس، يعالج أعراض زكام الحساسية، العطاس، وحكة العين والجلد." },
            "zyrtec": { category: "الجهاز التنفسي", description: "مضاد للهيستامين فعال لعلاج الحساسية، سيلان الأنف، الحكة، والشري الجلدي." },
            "lyrica": { category: "الجهاز العصبي", description: "مهدئ لآلام الأعصاب الناتجة عن السكري، إصابات الحبل الشوكي، أو مرض الحزام الناري." },
            "neurontin": { category: "الجهاز العصبي", description: "يستخدم للسيطرة على بعض أنواع التشنجات وعلاج الآلام العصبية المزمنة." },
            "tryptizol": { category: "الجهاز العصبي", description: "علاج مضاد للاكتئاب، ويستخدم بجرعات منخفضة للوقاية من الصداع النصفي وعلاج آلام الأعصاب." }
        };

        const seenDrugs = new Set();
        let deleteCount = 0;
        let updateCount = 0;

        for (const documentSnapshot of snapshot.docs) {
            const docRef = doc(db, "drugs", documentSnapshot.id);
            const currentData = documentSnapshot.data();
            
            const cleanName = currentData.name ? currentData.name.toLowerCase().trim() : "";
            const cleanScientific = currentData.scientific ? currentData.scientific.toLowerCase().trim() : "";
            const cleanStrength = currentData.strength ? currentData.strength.toLowerCase().trim() : "";
            
            // مفتاح فريد لمعرفة إذا كان الدواء مكرر
            const drugKey = `${cleanName}_${cleanScientific}_${cleanStrength}`;

            if (seenDrugs.has(drugKey)) {
                // حذف النسخة المكررة
                await deleteDoc(docRef);
                deleteCount++;
            } else {
                // حفظ النسخة الأولى وتحديث تصنيفها وشرحها
                seenDrugs.add(drugKey);
                
                if (medicalMap[cleanName]) {
                    await updateDoc(docRef, {
                        category: medicalMap[cleanName].category,
                        description: medicalMap[cleanName].description,
                        image: "https://cdn-icons-png.flaticon.com/512/883/883360.png"
                    });
                    updateCount++;
                } else {
                    await updateDoc(docRef, {
                        category: currentData.category || "أخرى",
                        description: currentData.description || "لا يوجد شرح حالي لهذا الدواء، يمكنك إضافة الشرح من لوحة الأدمن.",
                        image: currentData.image && !currentData.image.includes("unsplash") ? currentData.image : "https://cdn-icons-png.flaticon.com/512/883/883360.png"
                    });
                }
            }
        }
        
        alert(`🎉 نجاح تام!\nتم حذف ${deleteCount} دواء مكرر.\nتم تصنيف وشرح الأدوية بنجاح!`);
        loadAdminDrugs(); 
    } catch (err) {
        alert("حدث خطأ أثناء معالجة البيانات، يرجى المحاولة مجدداً.");
        console.error(err);
    }
}

// ربط الزر السحري بالدالة الموحدة
document.getElementById("magicClassifyBtn").addEventListener("click", cleanAndClassifyData);
function filterAdminDrugs(){

    const value=document.getElementById("adminSearch")
        .value
        .toLowerCase();

    document.querySelectorAll(".admin-drug-card").forEach(card=>{

        const text=card.innerText.toLowerCase();

        if(text.includes(value)){
            card.style.display="";
        }else{
            card.style.display="none";
        }

    });

}