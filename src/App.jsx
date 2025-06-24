import React, { useState, useMemo, useEffect, useRef, createContext, useContext } from 'react';
import { User, BookUser, Banknote, LayoutDashboard, Plus, X, Edit, Trash2, Search, AlertCircle, LogOut, Users, ShieldCheck, CreditCard, Landmark, Home, UserCheck, Library, Briefcase, Calendar, Users2, ChevronDown, Moon, Sun } from 'lucide-react';

// [FIREBASE] Import necessary functions from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, writeBatch, query, where, setDoc } from "firebase/firestore";

// Firebase configuration.
const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID,
    measurementId: process.env.REACT_APP_MEASUREMENT_ID
  };


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// Data that was previously hardcoded is now stored in Firestore
const teacherRoles = { principal: 'Hiệu trưởng', vice_principal: 'Hiệu phó', general_in_charge: 'Tổng phụ trách', department_head: 'Tổ trưởng', deputy_department_head: 'Tổ phó', teacher: 'Giáo viên', };

// === Theme Context for Dark/Light Mode (Unchanged) ===
const ThemeContext = createContext(null);
const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark = theme === 'dark';
        root.classList.toggle('dark', isDark);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
const useTheme = () => useContext(ThemeContext);
const ThemeToggleButton = () => {
    const { theme, toggleTheme } = useTheme();
    if (!theme) return null;
    return (
        <button onClick={toggleTheme} title="Đổi giao diện" className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
        </button>
    );
};

// === [FIREBASE] Main App Component - Manages Authentication State ===
function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setCurrentUser({ uid: user.uid, email: user.email, ...userDocSnap.data() });
        } else {
          console.error("User profile not found in Firestore! Signing out.");
          await signOut(auth);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error("Firebase Login Error:", error);
      const message = error.code === 'auth/invalid-credential' ? 'Email hoặc mật khẩu không đúng.' : 'Đã có lỗi xảy ra khi đăng nhập.';
      return { success: false, message };
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loadingAuth) {
    return <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">Đang kiểm tra phiên đăng nhập...</div>;
  }
  
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }
  
  const roleComponent = {
      admin: <AdminApplication currentUser={currentUser} onLogout={handleLogout} />,
      parent: <ParentApplication currentUser={currentUser} onLogout={handleLogout} />,
      teacher: <TeacherApplication currentUser={currentUser} onLogout={handleLogout} />,
  };
  return roleComponent[currentUser.role] || <div className="text-center p-8">Vai trò không hợp lệ hoặc bạn không có quyền truy cập.</div>;
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

// === Login Screen ===
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    setError('');
    setIsSubmitting(true);
    const result = await onLogin(email, password); 
    if (!result.success) {
        setError(result.message);
    }
    setIsSubmitting(false);
  };

  return ( 
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">Cổng Thông Tin Trường Học</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 block">Email đăng nhập</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 mt-2 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600" required />
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 block">Mật khẩu</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 mt-2 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600" required />
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <div><button type="submit" disabled={isSubmitting} className="w-full py-3 mt-4 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">{isSubmitting ? "Đang xử lý..." : "Đăng nhập"}</button></div>
                 <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t dark:border-gray-600">
                    <p className="font-semibold">Vui lòng sử dụng tài khoản đã được cấp.</p>
                </div>
            </form>
        </div>
    </div> 
  );
};

// === Admin Application ===
const AdminApplication = ({ currentUser, onLogout }) => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [data, setData] = useState({
        students: [], grades: [], fees: [], teachers: [], classes: [],
        subjects: [], departments: [], users: [], assignments: []
    });
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modal, setModal] = useState({ type: null, data: null });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    const fetchData = async (collectionsToFetch) => {
        try {
            const promises = collectionsToFetch.map(c => getDocs(collection(db, c)));
            const results = await Promise.all(promises);
            const fetchedData = results.reduce((acc, snapshot, index) => {
                acc[collectionsToFetch[index]] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                return acc;
            }, {});
            setData(prev => ({...prev, ...fetchedData}));
        } catch (error) {
            console.error("Error fetching admin data:", error);
            alert("Không thể tải dữ liệu từ máy chủ. Vui lòng kiểm tra lại Security Rules của Firestore.");
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            const allCollections = ['students', 'grades', 'fees', 'teachers', 'classes', 'subjects', 'departments', 'users', 'assignments'];
            await fetchData(allCollections);
            setIsLoading(false);
        };
        fetchAllData();
    }, []);

    useEffect(() => {
        const derivedSchedules = data.assignments.map(a => {
            const aClass = data.classes.find(c => c.id === a.classId);
            const subject = data.subjects.find(s => s.id === a.subjectId);
            return { id: a.id, teacherId: a.teacherId, day: a.day, period: a.period, className: aClass?.name || '---', subjectName: subject?.name || '---' };
        });
        setSchedules(derivedSchedules);
    }, [data.assignments, data.classes, data.subjects]);

    const openModal = (type, data = null) => setModal({ type, data });
    const closeModal = () => setModal({ type: null, data: null });

    const handleDelete = (action) => {
        setConfirmAction(() => action);
        setIsConfirmModalOpen(true);
    };
    const handleCloseConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setConfirmAction(null);
    };
  
    const handleSave = async (type, payload) => {
        const collectionName = type.endsWith('s') ? type : (type.endsWith('y') ? type.slice(0, -1) + 'ies' : type + 's');
        try {
            if (payload.id) {
                const docRef = doc(db, collectionName, payload.id);
                const { id, ...dataToUpdate } = payload;
                await updateDoc(docRef, dataToUpdate);
                setData(prev => ({ ...prev, [collectionName]: prev[collectionName].map(item => item.id === payload.id ? payload : item) }));
            } else {
                const docRef = await addDoc(collection(db, collectionName), payload);
                setData(prev => ({ ...prev, [collectionName]: [...prev[collectionName], { ...payload, id: docRef.id }] }));
            }
            closeModal();
        } catch (error) {
            console.error(`Error saving ${type}:`, error);
            alert(`Đã xảy ra lỗi khi lưu ${type}.`);
        }
    };
    
    const handleSaveDepartment = async (deptData, newSubjects) => {
        try {
            const batch = writeBatch(db);
            let deptId = deptData.id;

            if (deptId) { // Update Department
                const deptRef = doc(db, "departments", deptId);
                batch.update(deptRef, { name: deptData.name });
            } else { // Add new Department
                const newDeptRef = doc(collection(db, "departments"));
                batch.set(newDeptRef, { name: deptData.name });
                deptId = newDeptRef.id;
            }

            const subjectsInDb = data.subjects.filter(s => s.departmentId === deptId);
            subjectsInDb.forEach(dbSub => {
                if (!newSubjects.some(newSub => newSub.id === dbSub.id)) {
                    batch.delete(doc(db, "subjects", dbSub.id));
                }
            });
            
            newSubjects.forEach(sub => {
                if (String(sub.id).startsWith('new-')) {
                    const newSubRef = doc(collection(db, "subjects"));
                    batch.set(newSubRef, { name: sub.name, departmentId: deptId });
                } else { 
                    const subRef = doc(db, "subjects", sub.id);
                    batch.update(subRef, { name: sub.name, departmentId: deptId });
                }
            });
            
            await batch.commit();
            await fetchData(['departments', 'subjects']);
            closeModal();
        } catch (error) {
            console.error("Lỗi khi lưu tổ bộ môn:", error);
            alert("Đã xảy ra lỗi khi lưu tổ bộ môn.");
        }
    }

    const handleSaveUser = async (userPayload) => {
        try {
            if (userPayload.id) { // Editing a user
                 const userRef = doc(db, 'users', userPayload.id);
                 const { id, ...dataToUpdate } = userPayload;
                 await updateDoc(userRef, dataToUpdate);
                 setData(prev => ({...prev, users: prev.users.map(u => u.id === id ? userPayload : u)}));

            } else { // Creating a new user
                const { email, password, ...profileData } = userPayload;
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUser = userCredential.user;
                
                await setDoc(doc(db, "users", newUser.uid), profileData);
                setData(prev => ({ ...prev, users: [...prev.users, { ...profileData, id: newUser.uid }] }));
            }
            closeModal();
        } catch(error) {
            console.error("Error saving user:", error);
            alert(`Lỗi khi lưu người dùng: ${error.message}`);
        }
    };

    const setGradesAndSave = async (newGrades) => {
        setData(prev => ({...prev, grades: newGrades}));
        const batch = writeBatch(db);
        newGrades.forEach(grade => {
            if(grade.id) { 
                const { id, ...gradeData } = grade;
                const gradeRef = doc(db, 'grades', id);
                batch.set(gradeRef, gradeData, {merge: true});
            } else { 
                const gradeRef = doc(collection(db, 'grades'));
                batch.set(gradeRef, grade);
            }
        });
        await batch.commit();
        await fetchData(['grades']);
    };
    
    const setFeesAndSave = async (newFees) => {
        setData(prev => ({...prev, fees: newFees}));
        const batch = writeBatch(db);
        newFees.forEach(fee => {
            const { id, ...feeData } = fee;
             if(id) {
                const feeRef = doc(db, 'fees', id);
                batch.set(feeRef, feeData, {merge: true});
            } else {
                 const newFeeRef = doc(collection(db, 'fees'));
                 batch.set(newFeeRef, feeData);
            }
        });
        await batch.commit();
        await fetchData(['fees']);
    }

    const setAssignmentsAndSave = async (newAssignments) => {
        setData(prev => ({...prev, assignments: newAssignments}));
         const batch = writeBatch(db);
        newAssignments.forEach(item => {
            const { id, ...itemData } = item;
             if(id && typeof id === 'string') {
                const itemRef = doc(db, 'assignments', id);
                batch.set(itemRef, itemData, {merge: true});
            } else {
                 const newItemRef = doc(collection(db, 'assignments'));
                 batch.set(newItemRef, itemData);
            }
        });

        const currentIds = new Set(newAssignments.map(a => a.id));
        const originalAssignments = data.assignments;
        originalAssignments.forEach(orig => {
            if(!currentIds.has(orig.id)) {
                batch.delete(doc(db, 'assignments', orig.id));
            }
        });

        await batch.commit();
        await fetchData(['assignments']);
    }

    const renderView = () => {
        if (isLoading) { return <div className="flex items-center justify-center h-full">Đang tải dữ liệu...</div>; }
        const { students, grades, fees, teachers, classes, subjects, departments, users, assignments } = data;
        const views = {
            dashboard: <DashboardView studentCount={students.length} teacherCount={teachers.length} classCount={classes.length} />,
            profiles: <StudentProfileView allStudents={students} classes={classes} onAdd={(d) => openModal('student', d)} onEdit={(s) => openModal('student', s)} onDelete={(id) => handleDelete(async () => { await deleteDoc(doc(db, 'students', id)); setData(p=>({...p, students: p.students.filter(s => s.id !== id)})); handleCloseConfirmModal(); })} />,
            teachers: <TeacherManagementView allTeachers={teachers} departments={departments} onAdd={() => openModal('teacher')} onEdit={(t) => openModal('teacher', t)} onDelete={(id) => handleDelete(async () => { await deleteDoc(doc(db, 'teachers', id)); setData(p => ({ ...p, teachers: p.teachers.filter(t => t.id !== id)})); handleCloseConfirmModal(); })} />,
            classes: <ClassManagementView classes={classes} teachers={teachers} students={students} onAdd={() => openModal('class')} onEdit={(c) => openModal('class', c)} onDelete={(id) => handleDelete(async () => { await deleteDoc(doc(db, 'classes', id)); setData(p => ({ ...p, classes: p.classes.filter(c => c.id !== id)})); handleCloseConfirmModal(); })} />,
            departments: <DepartmentManagementView departments={departments} subjects={subjects} teachers={teachers} onAddDept={() => openModal('department')} onEditDept={(d) => openModal('department', d)} onDeleteDept={(id) => handleDelete(async () => { await deleteDoc(doc(db, 'departments', id)); await fetchData(['departments', 'subjects']); handleCloseConfirmModal();})}/>,
            assignments: <AssignmentView assignments={assignments} setAssignments={setAssignmentsAndSave} teachers={teachers} classes={classes} subjects={subjects}/>,
            grades: <GradeManagementView students={students} grades={grades} setGrades={setGradesAndSave} classes={classes} subjects={subjects} assignments={assignments}/>,
            fees: <FeeManagementView allStudents={students} fees={fees} setFees={setFeesAndSave}/>,
            users: <UserManagementView users={users} onAdd={() => openModal('user')} onEdit={(user) => openModal('user', user)} onDelete={(id) => handleDelete(async () => { await deleteDoc(doc(db, 'users', id)); await fetchData(['users']); handleCloseConfirmModal();})}/>
        };
        return views[currentView] || views.dashboard;
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
            <SidebarAdmin currentView={currentView} setCurrentView={setCurrentView} />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <HeaderAdmin currentUser={currentUser} onLogout={onLogout} />
                {renderView()}
            </main>
            {modal.type === 'student' && <StudentFormModal student={modal.data} onSave={(d) => handleSave('student', d)} onClose={closeModal} />}
            {modal.type === 'teacher' && <TeacherFormModal teacher={modal.data} departments={data.departments} onSave={(d) => handleSave('teacher', d)} onClose={closeModal} />}
            {modal.type === 'class' && <ClassFormModal classData={modal.data} teachers={data.teachers} onSave={(d) => handleSave('class', d)} onClose={closeModal} />}
            {modal.type === 'department' && <DepartmentFormModal department={modal.data} allSubjects={data.subjects} onSave={handleSaveDepartment} onClose={closeModal} />}
            {modal.type === 'user' && <UserFormModal user={modal.data} students={data.students} teachers={data.teachers} users={data.users} onSave={handleSaveUser} onClose={closeModal} />}
            <ConfirmModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={confirmAction} title="Xác nhận Xóa" message="Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác." />
        </div>
    );
};

// === Parent Application ===
const ParentApplication = ({ currentUser, onLogout }) => {
    const [currentView, setCurrentView] = useState('grades');
    const [isLoading, setIsLoading] = useState(true);
    const [studentData, setStudentData] = useState({ student: null, grades: [], fees: [], subjects: [] });
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [payingFee, setPayingFee] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser.studentId) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const studentDoc = await getDoc(doc(db, "students", currentUser.studentId));
                const student = studentDoc.exists() ? { id: studentDoc.id, ...studentDoc.data() } : null;

                const gradesQuery = query(collection(db, "grades"), where("studentId", "==", currentUser.studentId));
                const feesQuery = query(collection(db, "fees"), where("studentId", "==", currentUser.studentId));
                const subjectsQuery = getDocs(collection(db, "subjects"));

                const [gradesSnap, feesSnap, subjectsSnap] = await Promise.all([getDocs(gradesQuery), getDocs(feesQuery), subjectsQuery]);
                const grades = gradesSnap.docs.map(d => ({id: d.id, ...d.data()}));
                const fees = feesSnap.docs.map(d => ({id: d.id, ...d.data()}));
                const subjects = subjectsSnap.docs.map(d => ({id: d.id, ...d.data()}));
                
                setStudentData({ student, grades, fees, subjects });
            } catch (error) {
                console.error("Lỗi tải dữ liệu cho phụ huynh:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [currentUser.studentId]);

    const handleOpenPaymentModal = (fee) => { setPayingFee(fee); setIsPaymentModalOpen(true); };
    const handleClosePaymentModal = () => { setIsPaymentModalOpen(false); setPayingFee(null); };

    const handleConfirmPayment = async () => {
        if (!payingFee) return;
        try {
            const feeRef = doc(db, "fees", payingFee.id);
            await updateDoc(feeRef, { status: 'Đã thanh toán' });
            setStudentData(prev => ({ ...prev, fees: prev.fees.map(f => f.id === payingFee.id ? { ...f, status: 'Đã thanh toán' } : f) }));
            handleClosePaymentModal();
            alert(`Đã xác nhận thanh toán cho khoản "${payingFee.feeName}".`);
        } catch (error) {
            console.error("Lỗi khi xác nhận thanh toán:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
        }
    };

    const renderView = () => { 
        if (isLoading) return <div className="text-center p-8">Đang tải...</div>;
        if (!studentData.student) return <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">Không tìm thấy thông tin học sinh.</div>;
        
        const { grades, subjects, fees } = studentData;
        switch (currentView) { 
            case 'grades': return <StudentGradeView grades={grades} subjects={subjects} />; 
            case 'fees': return <StudentFeeView fees={fees} onPay={handleOpenPaymentModal} />; 
            default: return <StudentGradeView grades={grades} subjects={subjects} />; 
        } 
    };
  
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans">
            <SidebarParent currentView={currentView} setCurrentView={setCurrentView} />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <HeaderParent currentUser={currentUser} studentName={studentData.student?.name} onLogout={onLogout} />
                {renderView()}
            </main>
            {isPaymentModalOpen && <PaymentModal fee={payingFee} onClose={handleClosePaymentModal} onConfirm={handleConfirmPayment} />}
        </div>
    );
};

// === Teacher Application ===
const TeacherApplication = ({ currentUser, onLogout }) => {
    return <div className="p-8">Giao diện Giáo viên đang được xây dựng.</div>
};


// === Reusable & General Components ===
const SidebarAdmin = ({ currentView, setCurrentView }) => { const navItems = [ { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard }, { id: 'departments', label: 'Tổ Bộ môn', icon: Library }, { id: 'teachers', label: 'Quản lý Giáo viên', icon: UserCheck }, { id: 'classes', label: 'Quản lý Lớp học', icon: Home }, { id: 'assignments', label: 'Phân công GD', icon: Briefcase }, { id: 'profiles', label: 'Quản lý Hồ sơ HS', icon: Users }, { id: 'grades', label: 'Quản lý Điểm số', icon: BookUser }, { id: 'fees', label: 'Quản lý Học phí', icon: Banknote }, { id: 'users', label: 'Quản lý Tài khoản', icon: ShieldCheck }, ]; return ( <nav className="w-20 lg:w-64 bg-white dark:bg-gray-800 shadow-lg"><div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700"><h1 className="text-xl lg:text-2xl font-bold text-blue-600 text-center lg:text-left"><span className="lg:hidden">QLHS</span><span className="hidden lg:inline">Quản Lý Học Sinh</span></h1></div><ul className="mt-6">{navItems.map(item => (<li key={item.id} className="px-2 lg:px-4 mb-2"><button onClick={() => setCurrentView(item.id)} className={`w-full flex items-center justify-center lg:justify-start p-3 rounded-lg ${currentView === item.id ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'}`}><item.icon className="h-6 w-6 lg:mr-4" /> <span className="hidden lg:inline font-medium">{item.label}</span></button></li>))}</ul></nav> ); };
const HeaderAdmin = ({ currentUser, onLogout }) => ( <header className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 flex justify-between items-center"> <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Hệ thống Quản lý Trường học</h2> <div className="flex items-center gap-3"><ThemeToggleButton /><span className="text-gray-600 dark:text-gray-300 hidden md:inline">Chào, <span className="font-bold">{currentUser.name || 'Admin'}</span></span><button onClick={onLogout} title="Đăng xuất" className="p-2 text-gray-500 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 rounded-full"><LogOut size={22} /></button></div></header>);
const DashboardView = ({ studentCount, teacherCount, classCount }) => ( <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-6 border-l-4 border-blue-500"><div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-full"><Users className="text-blue-500 dark:text-blue-300" size={32} /></div><div><h3 className="text-gray-500 dark:text-gray-400 text-lg">Tổng số Học sinh</h3><p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{studentCount}</p></div></div> <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-6 border-l-4 border-green-500"><div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-full"><UserCheck className="text-green-500 dark:text-green-300" size={32} /></div><div><h3 className="text-gray-500 dark:text-gray-400 text-lg">Tổng số Giáo viên</h3><p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{teacherCount}</p></div></div> <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-6 border-l-4 border-yellow-500"><div className="bg-yellow-100 dark:bg-yellow-900/50 p-4 rounded-full"><Home className="text-yellow-500 dark:text-yellow-300" size={32} /></div><div><h3 className="text-gray-500 dark:text-gray-400 text-lg">Tổng số Lớp học</h3><p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{classCount}</p></div></div> </div> );
const StudentProfileView = ({ allStudents, classes, onAdd, onEdit, onDelete }) => { const [searchTerm, setSearchTerm] = useState(''); const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || null); const filteredStudents = useMemo(() => { return allStudents.filter(student => selectedClassId ? student.classId === selectedClassId : true).filter(student => student.name.toLowerCase().includes(searchTerm.toLowerCase())); }, [allStudents, selectedClassId, searchTerm]); const selectedClassStats = useMemo(() => { if (!selectedClassId) return null; const classStudents = allStudents.filter(student => student.classId === selectedClassId); const classSize = classStudents.length; const maleCount = classStudents.filter(s => s.gender === 'Nam').length; const femaleCount = classStudents.filter(s => s.gender === 'Nữ').length; return { classSize, maleCount, femaleCount }; }, [allStudents, selectedClassId]); return ( <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"> <div className="flex justify-between items-center mb-4 flex-wrap gap-4"> <div className="flex items-baseline gap-4 flex-wrap"> <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Hồ sơ Học sinh</h3> {selectedClassId && selectedClassStats && ( <span className="font-medium text-gray-600 dark:text-gray-400"> Sỉ số: {selectedClassStats.classSize} | Nam: {selectedClassStats.maleCount} | Nữ: {selectedClassStats.femaleCount} </span> )} </div> <div className="flex items-center gap-2 flex-grow sm:flex-grow-0"> <FormSelect name="classId" value={selectedClassId || ''} onChange={(e) => setSelectedClassId(e.target.value ? e.target.value : null)}> <option value="">Tất cả các lớp</option> {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)} </FormSelect> <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Tìm trong lớp..." /> <button onClick={() => onAdd({classId: selectedClassId})} className="bg-blue-500 text-white px-4 py-2 rounded-lg shrink-0">Thêm</button> </div> </div> <div className="overflow-x-auto"><table className="w-full text-left text-gray-800 dark:text-gray-300"><thead className="text-gray-700 dark:text-gray-200"><tr className="bg-gray-50 dark:bg-gray-700"><th className="p-4 font-semibold">Họ tên</th><th className="p-4 font-semibold">Ngày sinh</th><th className="p-4 font-semibold">Giới tính</th><th className="p-4 font-semibold">Địa chỉ</th><th className="p-4 font-semibold text-center">Hành động</th></tr></thead><tbody>{filteredStudents.map(s => (<tr key={s.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="p-4">{s.name}</td><td className="p-4">{s.dob}</td><td className="p-4">{s.gender}</td><td className="p-4">{s.address}</td><td className="p-4 text-center space-x-2"><button onClick={() => onEdit(s)} className="p-2 text-blue-600"><Edit size={18}/></button><button onClick={() => onDelete(s.id)} className="p-2 text-red-600"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div> </div> ); };
const StudentFormModal = ({ student, onSave, onClose }) => { const [formData, setFormData] = useState({ name: student?.name || '', dob: student?.dob || '', gender: student?.gender || 'Nam', address: student?.address || '', classId: student?.classId || '', parentName: student?.parentName || '', parentPhone: student?.parentPhone || '' }); const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value })); const handleSubmit = (e) => { e.preventDefault(); onSave({ ...student, ...formData }); }; return ( <FormModal title={student?.id ? 'Sửa Hồ sơ' : 'Thêm Học sinh mới'} onClose={onClose} onSubmit={handleSubmit}><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormInput label="Họ tên" name="name" value={formData.name} onChange={handleChange} required /><FormSelect label="Giới tính" name="gender" value={formData.gender} onChange={handleChange}><option value="Nam">Nam</option><option value="Nữ">Nữ</option></FormSelect></div><FormInput label="Ngày sinh" name="dob" type="date" value={formData.dob} onChange={handleChange} required /><FormInput label="Địa chỉ" name="address" value={formData.address} onChange={handleChange} /><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormInput label="Tên phụ huynh" name="parentName" value={formData.parentName} onChange={handleChange} /><FormInput label="SĐT phụ huynh" name="parentPhone" value={formData.parentPhone} onChange={handleChange} /></div></FormModal> ); };
const TeacherManagementView = ({ allTeachers, departments, onAdd, onEdit, onDelete }) => { const [searchTerm, setSearchTerm] = useState(''); const filteredTeachers = useMemo(() => allTeachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())), [allTeachers, searchTerm]); const getTitle = (gender) => gender === 'Nữ' ? 'Cô' : 'Thầy'; return (<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"><div className="flex justify-between items-center mb-4 flex-wrap gap-4"><h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Quản lý Giáo viên</h3><div className="flex items-center gap-2 flex-grow sm:flex-grow-0"><SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Tìm giáo viên..." /><button onClick={onAdd} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Thêm</button></div></div><div className="overflow-x-auto"><table className="w-full text-left text-gray-800 dark:text-gray-300"><thead className="text-gray-700 dark:text-gray-200"><tr className="bg-gray-50 dark:bg-gray-700"><th className="p-4 font-semibold">Họ tên</th><th className="p-4 font-semibold">Giới tính</th><th className="p-4 font-semibold">Vai trò</th><th className="p-4 font-semibold">Tổ Bộ môn</th><th className="p-4 font-semibold text-center">Hành động</th></tr></thead><tbody>{filteredTeachers.map(t => { const dept = departments.find(d => d.id === t.departmentId); return (<tr key={t.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="p-4">{`${getTitle(t.gender)} ${t.name}`}</td><td className="p-4">{t.gender}</td><td className="p-4">{teacherRoles[t.role] || t.role}</td><td className="p-4">{dept?.name || 'Chưa có'}</td><td className="p-4 text-center space-x-2"><button onClick={() => onEdit(t)} className="p-2 text-blue-600"><Edit size={18}/></button><button onClick={() => onDelete(t.id)} className="p-2 text-red-600"><Trash2 size={18}/></button></td></tr>)})}</tbody></table></div></div>);};
const TeacherFormModal = ({ teacher, departments, onSave, onClose }) => { const [formData, setFormData] = useState({ name: teacher?.name || '', gender: teacher?.gender || 'Nam', dob: teacher?.dob || '', phone: teacher?.phone || '', departmentId: teacher?.departmentId || '', role: teacher?.role || 'teacher' }); const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value }); const handleSubmit = e => { e.preventDefault(); onSave({ ...teacher, ...formData, departmentId: formData.departmentId }); }; return (<FormModal title={ teacher ? 'Sửa thông tin Giáo viên' : 'Thêm Giáo viên' } onClose={onClose} onSubmit={handleSubmit}><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormInput label="Họ tên" name="name" value={formData.name} onChange={handleChange} required /><FormInput label="Ngày sinh" name="dob" type="date" value={formData.dob} onChange={handleChange} required /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormInput label="Số điện thoại" name="phone" value={formData.phone} onChange={handleChange} /><FormSelect label="Giới tính" name="gender" value={formData.gender} onChange={handleChange}><option value="Nam">Nam</option><option value="Nữ">Nữ</option></FormSelect></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormSelect label="Tổ bộ môn" name="departmentId" value={formData.departmentId} onChange={handleChange}><option value="">Chọn tổ</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</FormSelect><FormSelect label="Vai trò" name="role" value={formData.role} onChange={handleChange}>{Object.entries(teacherRoles).map(([roleKey, roleName]) => ( <option key={roleKey} value={roleKey}>{roleName}</option> ))}</FormSelect></div></FormModal>); };
const ClassManagementView = ({ classes, teachers, students, onAdd, onEdit, onDelete }) => ( <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"> <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Danh sách Lớp học</h3><button onClick={onAdd} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Thêm Lớp</button></div> <div className="overflow-x-auto"><table className="w-full text-left text-gray-800 dark:text-gray-300"><thead className="text-gray-700 dark:text-gray-200"><tr className="bg-gray-50 dark:bg-gray-700"><th className="p-4 font-semibold">Tên lớp</th><th className="p-4 font-semibold">Giáo viên Chủ nhiệm</th><th className="p-4 font-semibold">Sỉ số / Giới tính</th><th className="p-4 font-semibold text-center">Hành động</th></tr></thead><tbody>{classes.map(c => { const teacher = teachers.find(t => t.id === c.homeroomTeacherId); const classStudents = students.filter(s => s.classId === c.id); const classSize = classStudents.length; const maleCount = classStudents.filter(s => s.gender === 'Nam').length; const femaleCount = classStudents.filter(s => s.gender === 'Nữ').length; return (<tr key={c.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="p-4">{c.name}</td><td className="p-4">{teacher ? `${teacher.gender === 'Nữ' ? 'Cô' : 'Thầy'} ${teacher.name}` : 'Chưa phân công'}</td><td className="p-4">{`${classSize} (Nam: ${maleCount}, Nữ: ${femaleCount})`}</td><td className="p-4 text-center space-x-2"><button onClick={() => onEdit(c)} className="p-2 text-blue-600"><Edit size={18}/></button><button onClick={() => onDelete(c.id)} className="p-2 text-red-600"><Trash2 size={18}/></button></td></tr>);})}</tbody></table></div> </div> );
const ClassFormModal = ({ classData, teachers, onSave, onClose }) => { const [formData, setFormData] = useState({ name: classData?.name || '', homeroomTeacherId: classData?.homeroomTeacherId || '' }); const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value }); const handleSubmit = e => { e.preventDefault(); onSave({ ...classData, ...formData, homeroomTeacherId: formData.homeroomTeacherId }); }; return (<FormModal title={classData ? 'Sửa thông tin Lớp' : 'Thêm Lớp mới'} onClose={onClose} onSubmit={handleSubmit}><FormInput label="Tên lớp" name="name" value={formData.name} onChange={handleChange} required /><FormSelect label="GVCN" name="homeroomTeacherId" value={formData.homeroomTeacherId} onChange={handleChange}><option value="">Chọn giáo viên</option>{teachers.map(t => <option key={t.id} value={t.id}>{`${t.gender === 'Nữ' ? 'Cô' : 'Thầy'} ${t.name}`}</option>)}</FormSelect></FormModal>); };
const FormModal = ({ title, onClose, onSubmit, children }) => ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto"><div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg m-4"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h3><button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={24} /></button></div><form onSubmit={onSubmit} className="space-y-4">{children}<div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Hủy</button><button type="submit" className="py-2 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow">Lưu</button></div></form></div></div> );
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => { if (!isOpen) return null; const handleConfirm = async () => { if (typeof onConfirm === 'function') { await onConfirm(); } }; return ( <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"><div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm m-4 text-center"><div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100"><AlertCircle className="h-6 w-6 text-red-600" /></div><h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">{title}</h3><div className="mt-2"><p className="text-sm text-gray-500 dark:text-gray-400">{message}</p></div><div className="mt-5 flex justify-center gap-4"><button type="button" onClick={onClose} className="w-full inline-flex justify-center rounded-md border dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">Hủy</button><button type="button" onClick={handleConfirm} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 font-medium text-white hover:bg-red-700">Xác nhận</button></div></div></div> ); };
const FormInput = ({ label, name, value, onChange, required = false, ...props }) => (<div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label><input name={name} value={value} onChange={onChange} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" required={required} {...props} /></div>);
const FormSelect = ({ label, name, value, onChange, children, required = false }) => (<div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label><select name={name} value={value} onChange={onChange} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200" required={required}>{children}</select></div>);
const SearchBar = ({ searchTerm, setSearchTerm, placeholder }) => ( <div className="relative"> <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /> <input type="text" placeholder={placeholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200" /> </div> );
const MultiSelectDropdown = ({ label, options, selectedValues, onChange, displayKey = 'name', valueKey = 'id', required = false }) => { const [isOpen, setIsOpen] = useState(false); const dropdownRef = useRef(null); const handleToggle = () => setIsOpen(!isOpen); const handleOptionClick = (value) => { const newSelectedValues = selectedValues.includes(value) ? selectedValues.filter(v => v !== value) : [...selectedValues, value]; onChange(newSelectedValues); }; useEffect(() => { const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { setIsOpen(false); } }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, [dropdownRef]); const getDisplayText = () => { if (selectedValues.length === 0) return `-- Chọn --`; if (selectedValues.length === 1) { if (label === "Tiết") return `Tiết ${selectedValues[0]}`; const selectedOption = options.find(opt => (typeof opt === 'object' ? opt[valueKey] : opt) === selectedValues[0]); return typeof selectedOption === 'object' ? selectedOption[displayKey] : selectedOption; } return `${selectedValues.length} mục đã chọn`; }; return ( <div className="relative" ref={dropdownRef}> <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label> <button type="button" onClick={handleToggle} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-left flex justify-between items-center text-gray-800 dark:text-gray-200" > <span className="truncate">{getDisplayText()}</span> <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} /> </button> {isOpen && ( <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"> <ul className="text-gray-800 dark:text-gray-200"> {options.map(option => { const value = typeof option === 'object' ? option[valueKey] : option; const display = typeof option === 'object' ? option[displayKey] : option; return ( <li key={value} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer flex items-center" onClick={() => handleOptionClick(value)} > <input type="checkbox" checked={selectedValues.includes(value)} readOnly className="mr-2" /> <span>{display}</span> </li> ); })} </ul> </div> )} </div> ); };

// [FIX] Full implementation of previously placeholder components
const DepartmentManagementView = ({ departments, subjects, teachers, onAddDept, onEditDept, onDeleteDept }) => { const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || null); const departmentTeachers = useMemo(() => teachers.filter(t => t.departmentId === selectedDeptId), [teachers, selectedDeptId]); const getTitle = (gender) => gender === 'Nữ' ? 'Cô' : 'Thầy'; const departmentSubjects = useMemo(() => subjects.filter(s => s.departmentId === selectedDeptId), [subjects, selectedDeptId]); return ( <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"> <div className="grid grid-cols-1 md:grid-cols-2 gap-8"> <div> <div className="flex justify-between items-center mb-4"> <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Tổ Bộ môn</h3> <button onClick={onAddDept} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm">Thêm Tổ</button> </div> <ul className="space-y-2">{departments.map(dept => (<li key={dept.id} onClick={() => setSelectedDeptId(dept.id)} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer text-gray-800 dark:text-gray-200 ${selectedDeptId === dept.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}><span className="font-medium">{dept.name}</span><div className="space-x-2"><button onClick={(e) => { e.stopPropagation(); onEditDept(dept); }} className="p-1 text-blue-600"><Edit size={16}/></button><button onClick={(e) => { e.stopPropagation(); onDeleteDept(dept.id);}} className="p-1 text-red-600"><Trash2 size={16}/></button></div></li>))}</ul> </div> <div> <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Thông tin Tổ: {departments.find(d=>d.id === selectedDeptId)?.name}</h3> {selectedDeptId ? ( <div className="space-y-6"> <div> <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Các môn học</h4> <ul className="space-y-1 list-disc list-inside text-gray-700 dark:text-gray-300">{departmentSubjects.map(sub => <li key={sub.id}>{sub.name}</li>)}</ul> </div> <div> <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Giáo viên trong Tổ</h4> <ul className="space-y-2">{departmentTeachers.map(teacher => { return ( <li key={teacher.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"> <div className="text-gray-800 dark:text-gray-200"> <p className="font-medium">{`${getTitle(teacher.gender)} ${teacher.name}`}</p> </div> </li> )})}</ul> </div> </div> ) : <p className="text-gray-500 dark:text-gray-400">Chọn một tổ để xem chi tiết.</p>} </div> </div> </div> ); };
const AssignmentView = ({ assignments, setAssignments, teachers, classes, subjects }) => { const [editing, setEditing] = useState(null); const [form, setForm] = useState({ teacherId: '', classId: '', subjectId: '', days: [], periods: [] }); const dayOptions = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']; const periodOptions = Array.from({ length: 10 }, (_, i) => i + 1); const handleEdit = (assignment) => { setEditing(assignment); setForm({ teacherId: assignment.teacherId, classId: assignment.classId, subjectId: assignment.subjectId, days: [assignment.day], periods: [assignment.period] }); }; const handleDelete = (id) => { setAssignments(assignments.filter(a => a.id !== id)); }; const handleChange = (e) => { const { name, value } = e.target; const isNumericField = ['teacherId', 'classId', 'subjectId'].includes(name); const processedValue = isNumericField && value ? value : value; setForm({ ...form, [name]: processedValue }); }; const handleMultiSelectChange = (name, values) => { setForm({ ...form, [name]: values }); }; const handleSubmit = (e) => { e.preventDefault(); const { teacherId, classId, subjectId, days, periods } = form; if (!teacherId || !classId || !subjectId || days.length === 0 || periods.length === 0) { alert("Vui lòng điền đầy đủ thông tin, bao gồm ít nhất một ngày và một tiết."); return; } if (editing) { const day = days[0]; const period = periods[0]; const conflict = assignments.find(a => a.day === day && a.period === period && (a.teacherId === teacherId || a.classId === classId) && a.id !== editing.id ); if (conflict) { alert(`Lịch bị trùng!`); return; } setAssignments(assignments.map(a => a.id === editing.id ? { ...a, teacherId, classId, subjectId, day, period } : a )); } else { const newAssignments = []; let isConflict = false; let lastId = assignments.length > 0 ? Math.max(...assignments.map(a => typeof a.id === 'number' ? a.id : 0)) : 0; for (const day of days) { for (const period of periods) { const conflict = assignments.find(a => a.day === day && a.period === period && (a.teacherId === teacherId || a.classId === classId) ); if (conflict) { alert(`Lịch bị trùng!`); isConflict = true; break; } newAssignments.push({ id: `new-${++lastId}`, teacherId, classId, subjectId, day, period }); } if(isConflict) break; } if (!isConflict) { setAssignments([...assignments, ...newAssignments]); } } handleCancel(); }; const handleCancel = () => { setEditing(null); setForm({ teacherId: '', classId: '', subjectId: '', days: [], periods: [] }); }; const getTitle = (gender) => gender === 'Nữ' ? 'Cô' : 'Thầy'; return ( <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-6"> <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Phân công Giảng dạy & Thời khóa biểu</h3> <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-4"> <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{editing ? "Chỉnh sửa Phân công" : "Thêm Phân công mới"}</h4> <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start"> <FormSelect label="Giáo viên" name="teacherId" value={form.teacherId || ''} onChange={handleChange} required> <option value="">-- Chọn GV --</option> {teachers.map(t => <option key={t.id} value={t.id}>{`${getTitle(t.gender)} ${t.name}`}</option>)} </FormSelect> <FormSelect label="Lớp" name="classId" value={form.classId || ''} onChange={handleChange} required> <option value="">-- Chọn lớp --</option> {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)} </FormSelect> <FormSelect label="Môn học" name="subjectId" value={form.subjectId || ''} onChange={handleChange} required> <option value="">-- Chọn môn --</option> {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)} </FormSelect> <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end"> <MultiSelectDropdown label="Ngày" options={dayOptions} selectedValues={form.days} onChange={(values) => handleMultiSelectChange('days', values)} required /> <MultiSelectDropdown label="Tiết" options={periodOptions} selectedValues={form.periods} onChange={(values) => handleMultiSelectChange('periods', values.sort((a,b) => a-b))} required /> <div className="flex gap-2 col-span-full md:col-span-2 self-end"> <button type="submit" className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"> {editing ? "Cập nhật" : "Thêm phân công"} </button> {editing && ( <button type="button" onClick={handleCancel} className="w-full bg-gray-300 dark:bg-gray-600 text-black dark:text-white px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"> Hủy </button> )} </div> </div> </form> </div> <div className="overflow-x-auto"> <table className="w-full text-left mt-4 text-gray-800 dark:text-gray-300"> <thead className="text-gray-700 dark:text-gray-200"> <tr className="bg-gray-50 dark:bg-gray-700"> <th className="p-4 font-semibold">Giáo viên</th> <th className="p-4 font-semibold">Lớp</th> <th className="p-4 font-semibold">Môn học</th> <th className="p-4 font-semibold">Ngày</th> <th className="p-4 font-semibold">Tiết</th> <th className="p-4 font-semibold text-center">Hành động</th> </tr> </thead> <tbody> {assignments.sort((a,b) => dayOptions.indexOf(a.day) - dayOptions.indexOf(b.day) || a.period - b.period).map(a => { const teacher = teachers.find(t => t.id === a.teacherId); const cls = classes.find(c => c.id === a.classId); const subject = subjects.find(s => s.id === a.subjectId); return ( <tr key={a.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"> <td className="p-4">{teacher ? `${getTitle(teacher.gender)} ${teacher.name}` : '---'}</td> <td className="p-4">{cls?.name || '---'}</td> <td className="p-4">{subject?.name || '---'}</td> <td className="p-4">{a.day}</td> <td className="p-4 text-center">{a.period}</td> <td className="p-4 text-center space-x-2"> <button onClick={() => handleEdit(a)} className="p-2 text-blue-600"><Edit size={18} /></button> <button onClick={() => handleDelete(a.id)} className="p-2 text-red-600"><Trash2 size={18} /></button> </td> </tr> ); })} </tbody> </table> </div> </div> ); };
const GradeManagementView = ({ students, grades, setGrades, classes, subjects, assignments, teacherId }) => { const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || null); const [editingCell, setEditingCell] = useState(null); const [cellValue, setCellValue] = useState(''); const classStudents = useMemo(() => students.filter(s => s.classId === selectedClassId), [students, selectedClassId]); const classSubjects = useMemo(() => { if (!teacherId) return subjects.filter(s => { const subjectAssignments = assignments.filter(a => a.subjectId === s.id && a.classId === selectedClassId); return subjectAssignments.length > 0; }); const assignedSubjectIds = assignments.filter(a => a.teacherId === teacherId && a.classId === selectedClassId).map(a => a.subjectId); return subjects.filter(s => assignedSubjectIds.includes(s.id)); }, [subjects, assignments, teacherId, selectedClassId]); const handleCellClick = (studentId, subjectId, type, score, index = -1) => { setEditingCell({ studentId, subjectId, type, index }); setCellValue(score); }; const handleCellValueChange = (e) => setCellValue(e.target.value); const handleUpdateGrade = () => { if (!editingCell) return; const { studentId, subjectId, type, index } = editingCell; const newScore = parseFloat(cellValue); if (isNaN(newScore) && cellValue !== '') { setEditingCell(null); return; } const scoreToSave = cellValue === '' ? null : newScore; setGrades(prevGrades => { const gradeRecord = prevGrades.find(g => g.studentId === studentId && g.subjectId === subjectId); if (gradeRecord) { return prevGrades.map(g => { if (g.studentId === studentId && g.subjectId === subjectId) { const updatedGrade = { ...g }; if (type === 'final') { updatedGrade.final = scoreToSave; } else { const newScores = [...(updatedGrade[type] || [])]; if (index > -1) { if (scoreToSave === null) { newScores.splice(index, 1); } else { newScores[index] = scoreToSave; } } else if (scoreToSave !== null) { newScores.push(scoreToSave); } updatedGrade[type] = newScores; } return updatedGrade; } return g; }); } else { if (scoreToSave === null) return prevGrades; const newGrade = { id: `new-${Date.now()}`, studentId, subjectId, heso1: [], heso2: [], final: null }; if (type === 'final') { newGrade.final = scoreToSave; } else { newGrade[type] = [scoreToSave]; } return [...prevGrades, newGrade]; } }); setEditingCell(null); }; const calculateTBM = (studentId, subjectId) => { const grade = grades.find(g => g.studentId === studentId && g.subjectId === subjectId); if (!grade) return '-'; const heso1 = grade.heso1 || []; const heso2 = grade.heso2 || []; const final = grade.final; const sumHeso1 = heso1.reduce((a, b) => a + b, 0); const sumHeso2 = heso2.reduce((a, b) => a + b, 0); const totalPoints = sumHeso1 + (sumHeso2 * 2) + (final != null ? final * 3 : 0); const totalFactors = heso1.length + (heso2.length * 2) + (final != null ? 3 : 0); if (totalFactors === 0) return '-'; return (totalPoints / totalFactors).toFixed(2); }; return ( <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-6"> <div className="flex items-center gap-4"> <label className="font-medium text-gray-800 dark:text-gray-200">Chọn lớp:</label> <select value={selectedClassId || ''} onChange={(e) => setSelectedClassId(e.target.value ? e.target.value : null)} className="border rounded-lg p-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"> {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)} </select> </div> <div className="overflow-x-auto"> <table className="w-full border-collapse text-center text-gray-800 dark:text-gray-200"> <thead className="text-gray-700 dark:text-gray-200"> <tr className="bg-gray-100 dark:bg-gray-700"> <th className="p-2 border border-gray-300 dark:border-gray-600" rowSpan="2">Học sinh</th> {classSubjects.map(sub => ( <th key={sub.id} className="p-2 border border-gray-300 dark:border-gray-600" colSpan="4">{sub.name}</th> ))} </tr> <tr className="bg-gray-50 dark:bg-gray-700/50">
    {/* [FIX] Changed React.Fragment to an array to prevent DOM nesting errors */}
    {classSubjects.flatMap(sub => ([
        <th key={`${sub.id}-hs1`} className="p-2 border border-gray-300 dark:border-gray-600 text-xs font-medium">HS1</th>,
        <th key={`${sub.id}-hs2`} className="p-2 border border-gray-300 dark:border-gray-600 text-xs font-medium">HS2</th>,
        <th key={`${sub.id}-final`} className="p-2 border border-gray-300 dark:border-gray-600 text-xs font-medium">Cuối kỳ</th>,
        <th key={`${sub.id}-tbm`} className="p-2 border border-gray-300 dark:border-gray-600 text-xs font-semibold">TBM</th>
    ]))}
</tr> </thead> <tbody> {classStudents.map(student => ( <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"> <td className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left">{student.name}</td> {classSubjects.flatMap(subject => { const grade = grades.find(g => g.studentId === student.id && g.subjectId === subject.id) || { heso1: [], heso2: [], final: null }; const isEditing = (type, index = -1) => editingCell?.studentId === student.id && editingCell?.subjectId === subject.id && editingCell?.type === type && editingCell?.index === index; const renderCell = (type, score, index = -1) => (isEditing(type, index) ? <input type="number" value={cellValue} onChange={handleCellValueChange} onBlur={handleUpdateGrade} onKeyDown={e => e.key === 'Enter' && handleUpdateGrade()} autoFocus className="w-12 text-center bg-yellow-100 dark:bg-yellow-800 border-blue-500 border-2 rounded"/> : <span onClick={() => handleCellClick(student.id, subject.id, type, score ?? '', index)} className="cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-800 rounded px-1">{score ?? '-'}</span> ); const renderScoreList = (type, scoreArray) => (<> {scoreArray && scoreArray.length > 0 ? scoreArray.map((s, i) => ( <React.Fragment key={`${type}-${s}-${i}`}> {renderCell(type, s, i)} {i < scoreArray.length - 1 && ', '} </React.Fragment> )) : (isEditing(type, -1) ? null : renderCell(type, null, -1) )} {isEditing(type, -1) && ( <input type="number" value={cellValue} onChange={handleCellValueChange} onBlur={handleUpdateGrade} onKeyDown={e => e.key === 'Enter' && handleUpdateGrade()} autoFocus className="w-12 text-center bg-yellow-100 dark:bg-yellow-800 border-blue-500 border-2 rounded"/> )} </>); return [ <td key={`${subject.id}-hs1`} className="p-2 border border-gray-300 dark:border-gray-600 text-sm" onClick={(e) => { if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SPAN') handleCellClick(student.id, subject.id, 'heso1', '', -1) }}> {renderScoreList('heso1', grade.heso1)} </td>, <td key={`${subject.id}-hs2`} className="p-2 border border-gray-300 dark:border-gray-600 text-sm" onClick={(e) => { if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SPAN') handleCellClick(student.id, subject.id, 'heso2', '', -1) }}> {renderScoreList('heso2', grade.heso2)} </td>, <td key={`${subject.id}-final`} className="p-2 border border-gray-300 dark:border-gray-600 text-sm"> {renderCell('final', grade.final, -1)} </td>, <td key={`${subject.id}-tbm`} className="p-2 border border-gray-300 dark:border-gray-600 text-sm font-semibold bg-gray-50 dark:bg-gray-700/50"> {calculateTBM(student.id, subject.id)} </td> ]; })} </tr> ))} </tbody> </table> </div> </div> ); };
const FeeManagementView = ({ allStudents, fees, setFees }) => { const [searchTerm, setSearchTerm] = useState(''); const filteredStudents = useMemo(() => allStudents.filter(student => student.name.toLowerCase().includes(searchTerm.toLowerCase())), [allStudents, searchTerm]); const [selectedStudentId, setSelectedStudentId] = useState(filteredStudents[0]?.id || null); useEffect(() => { if (!filteredStudents.find(s => s.id === selectedStudentId)) { setSelectedStudentId(filteredStudents[0]?.id || null); } }, [filteredStudents, selectedStudentId]); const [newFee, setNewFee] = useState({ feeName: '', amount: '', dueDate: '' }); const studentFees = useMemo(() => fees.filter(f => f.studentId === selectedStudentId), [fees, selectedStudentId]); const handleFeeChange = (e) => setNewFee({ ...newFee, [e.target.name]: e.target.value }); const handleAddFeeSubmit = (e) => { e.preventDefault(); const amount = parseFloat(newFee.amount); if (!newFee.feeName || isNaN(amount) || !newFee.dueDate) return alert("Vui lòng nhập đầy đủ thông tin."); setFees([...fees, { studentId: selectedStudentId, feeName: newFee.feeName, amount, dueDate: newFee.dueDate, status: 'Chưa thanh toán' }]); setNewFee({ feeName: '', amount: '', dueDate: '' }); }; const toggleStatus = (feeId) => setFees(fees.map(f => f.id === feeId ? { ...f, status: f.status === 'Đã thanh toán' ? 'Chưa thanh toán' : 'Đã thanh toán' } : f)); return (<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-6"><div className="flex items-center gap-4 flex-wrap"><label className="font-medium shrink-0 text-gray-800 dark:text-gray-200">Quản lý học phí cho:</label><div className="flex-grow min-w-[200px]"><SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Tìm học sinh..."/></div><div className="flex-grow min-w-[200px]"><FormSelect name="studentId" value={selectedStudentId || ''} onChange={(e) => setSelectedStudentId(e.target.value ? e.target.value : null)}>{filteredStudents.length > 0 ? filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>) : <option>Không tìm thấy học sinh</option>}</FormSelect></div></div>{selectedStudentId ? <div className="overflow-x-auto"><table className="w-full text-left text-gray-800 dark:text-gray-300"><thead className="text-gray-700 dark:text-gray-200"><tr className="bg-gray-50 dark:bg-gray-700"><th className="p-4 font-semibold">Khoản thu</th><th className="p-4 font-semibold">Số tiền</th><th className="p-4 font-semibold">Hạn nộp</th><th className="p-4 font-semibold text-center">Trạng thái</th><th className="p-4 font-semibold text-center">Hành động</th></tr></thead><tbody>{studentFees.map(f => (<tr key={f.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="p-4">{f.feeName}</td><td className="p-4">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(f.amount)}</td><td className="p-4">{f.dueDate}</td><td className="p-4 text-center"><span className={`px-2 py-1 text-xs rounded-full ${f.status === 'Đã thanh toán' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>{f.status}</span></td><td className="p-4 text-center"><button onClick={() => toggleStatus(f.id)} className="text-sm bg-indigo-500 text-white px-3 py-1 rounded">Đổi</button></td></tr>))}</tbody><tfoot className="text-gray-800 dark:text-gray-200"><tr className="bg-gray-50 dark:bg-gray-700"><td className="p-2"><input type="text" name="feeName" value={newFee.feeName} onChange={handleFeeChange} placeholder="Tên khoản thu" className="w-full border rounded p-2 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500"/></td><td className="p-2"><input type="number" name="amount" value={newFee.amount} onChange={handleFeeChange} placeholder="Số tiền" className="w-full border rounded p-2 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500"/></td><td className="p-2"><input type="date" name="dueDate" value={newFee.dueDate} onChange={handleFeeChange} className="w-full border rounded p-2 bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500"/></td><td className="p-2 text-center" colSpan="2"><button onClick={handleAddFeeSubmit} className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full">Thêm</button></td></tr></tfoot></table></div> : <p className="text-gray-500 dark:text-gray-400">Vui lòng chọn một học sinh.</p>}</div>);};
const UserManagementView = ({ users, onAdd, onEdit, onDelete }) => { return ( <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"> <div className="flex justify-between items-center mb-4"> <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">Danh sách Tài khoản</h3> <button onClick={onAdd} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Thêm Tài khoản</button> </div> <div className="overflow-x-auto"> <table className="w-full text-left text-gray-800 dark:text-gray-300"> <thead className="text-gray-700 dark:text-gray-200"><tr className="bg-gray-50 dark:bg-gray-700"><th className="p-4 font-semibold">Tên hiển thị</th><th className="p-4 font-semibold">Email</th><th className="p-4 font-semibold">Vai trò</th><th className="p-4 font-semibold text-center">Hành động</th></tr></thead> <tbody>{users.map(user => ( <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"> <td className="p-4">{user.name}</td> <td className="p-4">{user.email}</td> <td className="p-4"><span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'}`}>{user.role}</span></td> <td className="p-4 text-center space-x-2"> <button onClick={() => onEdit(user)} className="p-2 text-blue-600 disabled:opacity-50" disabled={user.role === 'admin'}><Edit size={18} /></button> <button onClick={() => onDelete(user.id)} className="p-2 text-red-600 disabled:opacity-50" disabled={user.role === 'admin'}><Trash2 size={18} /></button> </td> </tr> ))}</tbody> </table> </div> </div> ); };
const DepartmentFormModal = ({ department, allSubjects, onSave, onClose }) => { const [name, setName] = useState(department?.name || ''); const [subjects, setSubjects] = useState(() => allSubjects.filter(s => s.departmentId === department?.id)); const [newSubject, setNewSubject] = useState(''); const handleAddSubject = () => { if(newSubject.trim() === '') return; setSubjects([...subjects, { id: `new-${Date.now()}`, name: newSubject.trim() }]); setNewSubject(''); }; const handleRemoveSubject = (subjectId) => setSubjects(subjects.filter(s => s.id !== subjectId)); const handleSubmit = (e) => { e.preventDefault(); onSave({ ...department, name }, subjects); }; return ( <FormModal title={department ? 'Sửa Tổ Bộ môn' : 'Thêm Tổ Bộ môn'} onClose={onClose} onSubmit={handleSubmit}> <FormInput label="Tên Tổ Bộ môn" name="name" value={name} onChange={e => setName(e.target.value)} required /> <div> <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Các môn học</label> <div className="space-y-2 max-h-40 overflow-y-auto"> {subjects.map(sub => ( <div key={sub.id} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-800 dark:text-gray-200"> <span>{sub.name}</span> <button type="button" onClick={() => handleRemoveSubject(sub.id)} className="p-1 text-red-500 hover:text-red-700"> <X size={16}/> </button> </div> ))} </div> <div className="flex gap-2 mt-2"> <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Tên môn học mới" className="flex-grow border rounded-lg p-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"/> <button type="button" onClick={handleAddSubject} className="bg-green-500 text-white px-4 rounded-lg">Thêm</button> </div> </div> </FormModal> ); };
const UserFormModal = ({ user, students, teachers, users, onSave, onClose }) => { const isEditing = !!user?.id; const [formData, setFormData] = useState({ email: user?.email || '', password: '', role: user?.role || 'parent', linkedId: user?.studentId || user?.teacherId || '', name: user?.name || '' }); const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); }; const handleSubmit = (e) => { e.preventDefault(); if (!formData.email || (isEditing ? false : !formData.password)) { return alert('Vui lòng điền đầy đủ thông tin. Mật khẩu là bắt buộc khi tạo mới.'); } if (!isEditing && users.some(u => u.email === formData.email)) { return alert('Email đã tồn tại.'); } let finalData = { ...user, ...formData }; if(!formData.password && isEditing) { delete finalData.password; } if (!isEditing) { if (formData.role === 'parent') { const student = students.find(s => s.id === formData.linkedId); finalData.name = `PH: ${student?.parentName || student?.name}`; finalData.studentId = formData.linkedId; delete finalData.teacherId; } else { const teacher = teachers.find(t => t.id === formData.linkedId); finalData.name = `${teacher.gender === 'Nữ' ? 'Cô' : 'Thầy'} ${teacher?.name}`; finalData.teacherId = formData.linkedId; delete finalData.studentId; } } onSave(finalData); }; return ( <FormModal title={isEditing ? 'Sửa Tài khoản' : 'Thêm Tài khoản mới'} onClose={onClose} onSubmit={handleSubmit}> <FormInput label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={isEditing} /> <FormInput label="Mật khẩu" name="password" type="password" placeholder={isEditing ? "Để trống nếu không đổi" : ""} value={formData.password} onChange={handleChange} required={!isEditing} /> {!isEditing && ( <> <FormSelect label="Vai trò" name="role" value={formData.role} onChange={handleChange}> <option value="parent">Phụ huynh</option> <option value="teacher">Giáo viên</option> </FormSelect> <FormSelect label={formData.role === 'parent' ? 'Liên kết với HS' : 'Liên kết với GV'} name="linkedId" value={formData.linkedId} onChange={handleChange} required> <option value="">-- Chọn --</option> {formData.role === 'parent' ? students.map(s => <option key={s.id} value={s.id}>{s.name}</option>) : teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)} </FormSelect> </> )} </FormModal> ); };
const SidebarParent = ({currentView, setCurrentView}) => { const navItems = [{id: 'grades', label: 'Kết quả học tập', icon: BookUser}, {id: 'fees', label: 'Thông tin học phí', icon: Banknote}]; return ( <nav className="w-20 lg:w-64 bg-white dark:bg-gray-800 shadow-lg"><div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700"><h1 className="text-xl lg:text-2xl font-bold text-blue-600 text-center lg:text-left"><span className="lg:hidden">HS</span><span className="hidden lg:inline">Góc Phụ huynh</span></h1></div><ul className="mt-6">{navItems.map(item => (<li key={item.id} className="px-2 lg:px-4 mb-2"><button onClick={() => setCurrentView(item.id)} className={`w-full flex items-center justify-center lg:justify-start p-3 rounded-lg ${currentView === item.id ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'}`}><item.icon className="h-6 w-6 lg:mr-4" /> <span className="hidden lg:inline font-medium">{item.label}</span></button></li>))}</ul></nav> ); };
const HeaderParent = ({ currentUser, studentName, onLogout }) => ( <header className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 flex justify-between items-center"><div><h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Học sinh: {studentName}</h2><p className="text-gray-500 dark:text-gray-400">Chào mừng, {currentUser.name}</p></div><div className="flex items-center gap-3"><ThemeToggleButton /><button onClick={onLogout} title="Đăng xuất" className="p-2 text-gray-500 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 rounded-full"><LogOut size={22} /></button></div></header>);
const StudentGradeView = ({ grades, subjects }) => { const calculateTBM = (grade) => { if (!grade) return 0; const hs1 = grade.heso1 || []; const hs2 = grade.heso2 || []; const final = grade.final; const sum1 = hs1.reduce((a, b) => a + b, 0); const sum2 = hs2.reduce((a, b) => a + b, 0); const total = sum1 + (sum2 * 2) + (final != null ? final * 3 : 0); const factors = hs1.length + (hs2.length * 2) + (final != null ? 3 : 0); return factors === 0 ? 0 : total / factors; }; return ( <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"><h3 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-200">Bảng điểm năm học</h3><div className="overflow-x-auto"><table className="w-full text-left text-gray-800 dark:text-gray-300"><thead className="text-gray-700 dark:text-gray-200"><tr className="bg-gray-50 dark:bg-gray-700"><th className="p-4 font-semibold">Môn học</th><th className="p-4 font-semibold">Điểm HS1</th><th className="p-4 font-semibold">Điểm HS2</th><th className="p-4 font-semibold">Điểm Cuối kỳ</th><th className="p-4 font-semibold">TBM</th></tr></thead><tbody>{subjects.map(sub => { const grade = grades.find(g => g.subjectId === sub.id); return (<tr key={sub.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="p-4 font-medium">{sub.name}</td><td className="p-4">{grade?.heso1?.join(', ') || '-'}</td><td className="p-4">{grade?.heso2?.join(', ') || '-'}</td><td className="p-4">{grade?.final?.toFixed(1) || '-'}</td><td className="p-4 font-bold text-blue-600 dark:text-blue-400">{calculateTBM(grade).toFixed(2)}</td></tr>);})}</tbody></table></div></div> ); };
const StudentFeeView = ({ fees, onPay }) => ( <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm"><h3 className="text-xl font-bold mb-4 text-gray-700 dark:text-gray-200">Các khoản phí</h3><div className="overflow-x-auto"><table className="w-full text-left text-gray-800 dark:text-gray-300"><thead className="text-gray-700 dark:text-gray-200"><tr className="bg-gray-50 dark:bg-gray-700"><th className="p-4 font-semibold">Tên khoản thu</th><th className="p-4 font-semibold">Số tiền</th><th className="p-4 font-semibold">Hạn nộp</th><th className="p-4 font-semibold text-center">Trạng thái</th><th className="p-4 font-semibold text-center">Hành động</th></tr></thead><tbody>{fees.length > 0 ? fees.map(f => (<tr key={f.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="p-4">{f.feeName}</td><td className="p-4">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(f.amount)}</td><td className="p-4">{f.dueDate}</td><td className="p-4 text-center"><span className={`px-2 py-1 text-xs rounded-full ${f.status === 'Đã thanh toán' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>{f.status}</span></td><td className="p-4 text-center">{f.status === 'Chưa thanh toán' ? <button onClick={() => onPay(f)} className="py-1 px-4 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">Thanh toán</button> : <ShieldCheck className="w-5 h-5 text-green-500 mx-auto" />}</td></tr>)) : <tr><td colSpan="5" className="text-center p-8 text-gray-500 dark:text-gray-400">Không có khoản phí nào.</td></tr>}</tbody></table></div></div> );
const PaymentModal = ({ fee, onClose, onConfirm }) => { const [paymentMethod, setPaymentMethod] = useState('bank'); return ( <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"><div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md m-4"><div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Thanh toán Học phí</h3><button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={24} /></button></div><div className="space-y-4 text-gray-800 dark:text-gray-200"><p><span className="font-semibold">Khoản phí:</span> {fee.feeName}</p><p className="text-2xl font-bold text-red-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fee.amount)}</p><div className="pt-4 border-t border-gray-200 dark:border-gray-600"><p className="font-semibold mb-2">Chọn phương thức:</p><div className="space-y-2"><label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"><input type="radio" name="paymentMethod" value="bank" checked={paymentMethod === 'bank'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" /><span className="ml-3 flex items-center gap-2"><Landmark size={20}/> Chuyển khoản</span></label><label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"><input type="radio" name="paymentMethod" value="momo" checked={paymentMethod === 'momo'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" /><span className="ml-3 flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" className="w-5 h-5"/> Ví MoMo</span></label><label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"><input type="radio" name="paymentMethod" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" /><span className="ml-3 flex items-center gap-2"><CreditCard size={20}/> Thẻ tín dụng</span></label></div></div><div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Hủy</button><button type="button" onClick={onConfirm} className="py-2 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow">Xác nhận</button></div></div></div></div> ); };