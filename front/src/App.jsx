import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, ChevronRight, User, Lock, Globe, Code, BookOpen, Play, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

const setCookie = (name, value, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
};

const App = () => {
  const [currentView, setCurrentView] = useState('login');
  const [jwt, setJwt] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    knownLanguage: '',
    targetLanguage: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [languages, setLanguages] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [knownLanguageLessons, setKnownLanguageLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [solutionResult, setSolutionResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedJwt = getCookie('auth_token');
    const savedKnownLang = getCookie('known_language');
    const savedTargetLang = getCookie('target_language');
    
    if (savedJwt) {
      setJwt(savedJwt);
      if (savedKnownLang && savedTargetLang) {
        setFormData(prev => ({
          ...prev,
          knownLanguage: savedKnownLang,
          targetLanguage: savedTargetLang
        }));
        setCurrentView('lessons');
        fetchLessons(savedJwt, savedTargetLang);
        fetchKnownLanguageLessons(savedJwt, savedKnownLang);
      } else {
        checkUserLanguages(savedJwt);
      }
    }
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const fetchLanguagesForRegistration = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-languages`);
      if (response.ok) {
        const data = await response.json();
        setLanguages(data);
      }
    } catch (err) {
      setError('Не удалось загрузить языки');
      setTimeout(clearMessages, 5000);
    }
  };

  const checkUserLanguages = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-lessons-target`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLessons(data);
        setCurrentView('lessons');
        
        const langResponse = await fetch(`${API_BASE_URL}/get-lessons-known`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (langResponse.ok) {
          const knownData = await langResponse.json();
          setKnownLanguageLessons(knownData);
        }
      } else {
        setCurrentView('languageSelection');
        fetchLanguagesForRegistration();
      }
    } catch (err) {
      setError('Ошибка при проверке языков. Пожалуйста, выберите языки.');
      setCurrentView('languageSelection');
      fetchLanguagesForRegistration();
      setTimeout(clearMessages, 5000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearMessages();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        setJwt(data.jwt);
        setCookie('auth_token', data.jwt);
        
        const langResponse = await fetch(`${API_BASE_URL}/get-lessons-target`, {
          headers: { 'Authorization': `Bearer ${data.jwt}` }
        });
        
        if (langResponse.ok) {
          const lessonData = await langResponse.json();
          setLessons(lessonData);
          setCurrentView('lessons');
          
          try {
            const knownLangResponse = await fetch(`${API_BASE_URL}/get-lessons-known`, {
              headers: { 'Authorization': `Bearer ${data.jwt}` }
            });
            
            if (knownLangResponse.ok) {
              const knownData = await knownLangResponse.json();
              setKnownLanguageLessons(knownData);
            }
          } catch (err) {
          }
        } else {
          setCurrentView('languageSelection');
          fetchLanguagesForRegistration();
        }
        
        setSuccess('Вход выполнен успешно!');
        setTimeout(clearMessages, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Ошибка входа');
        setTimeout(clearMessages, 5000);
      }
    } catch (err) {
      setError('Ошибка сети. Пожалуйста, попробуйте снова.');
      setTimeout(clearMessages, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      const response = await fetch(`${API_BASE_URL}/registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          password: formData.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        setJwt(data.jwt);
        setCookie('auth_token', data.jwt);
        
        await fetchLanguagesForRegistration();
        
        setCurrentView('languageSelection');
        setSuccess('Регистрация прошла успешно!');
        setTimeout(clearMessages, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Ошибка регистрации');
        setTimeout(clearMessages, 5000);
      }
    } catch (err) {
      setError('Ошибка сети. Пожалуйста, попробуйте снова.');
      setTimeout(clearMessages, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelection = async () => {
    setLoading(true);
    clearMessages();
    try {
      const response = await fetch(`${API_BASE_URL}/register-languages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          known_language: formData.knownLanguage,
          target_language: formData.targetLanguage
        })
      });

      if (response.ok) {
        setCookie('known_language', formData.knownLanguage);
        setCookie('target_language', formData.targetLanguage);
        
        setCurrentView('lessons');
        setSuccess('Языки успешно выбраны!');
        setTimeout(clearMessages, 3000);
        await fetchLessons(jwt, formData.targetLanguage);
        await fetchKnownLanguageLessons(jwt, formData.knownLanguage);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Не удалось сохранить языки');
        setTimeout(clearMessages, 5000);
      }
    } catch (err) {
      setError('Ошибка сети. Пожалуйста, попробуйте снова.');
      setTimeout(clearMessages, 5000);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async (token, targetLang) => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-lessons-target`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLessons(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Не удалось загрузить уроки');
        setTimeout(clearMessages, 5000);
      }
    } catch (err) {
      setError('Ошибка сети. Пожалуйста, попробуйте снова.');
      setTimeout(clearMessages, 5000);
    }
  };

  const fetchKnownLanguageLessons = async (token, knownLang) => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-lessons-known`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setKnownLanguageLessons(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Не удалось загрузить уроки для известного языка');
        setTimeout(clearMessages, 5000);
      }
    } catch (err) {
      setError('Ошибка сети. Пожалуйста, попробуйте снова.');
      setTimeout(clearMessages, 5000);
    }
  };

  const handleStartLesson = (lesson) => {
    setCurrentLesson(lesson);
    setUserCode('');
    setSolutionResult(null);
    setCurrentView('lesson');
    clearMessages();
  };

  const handleCheckSolution = async () => {
    setLoading(true);
    clearMessages();
    try {
      const targetLang = formData.targetLanguage || getCookie('target_language');
      const response = await fetch(
        `${API_BASE_URL}/check-solution?code=${encodeURIComponent(userCode)}&topic=${encodeURIComponent(currentLesson.topic)}&language=${encodeURIComponent(targetLang)}`,
        {
          headers: { 'Authorization': `Bearer ${jwt}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSolutionResult(data.result);
        if (data.result) {
          setSuccess('Правильное решение!');
          setTimeout(clearMessages, 3000);
        } else {
          setError('Неправильное решение. Попробуйте еще раз!');
          setTimeout(clearMessages, 5000);
        }
      } else {
        setError('Не удалось проверить решение');
        setTimeout(clearMessages, 5000);
      }
    } catch (err) {
      setError('Ошибка сети. Пожалуйста, попробуйте снова.');
      setTimeout(clearMessages, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    deleteCookie('auth_token');
    deleteCookie('known_language');
    deleteCookie('target_language');
    
    setJwt('');
    setFormData({
      username: '',
      password: '',
      name: '',
      knownLanguage: '',
      targetLanguage: ''
    });
    setCurrentView('login');
    clearMessages();
  };

  const formatCodeForDisplay = (code) => {
    if (!code) return '';
    return code.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  };

  const findMatchingKnownLanguageLesson = (targetTopic) => {
    return knownLanguageLessons.find(lesson => lesson.topic === targetTopic);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Code className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">CodeLingo</h1>
          </div>
          {jwt && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
            >
              Выйти
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center">
            <XCircle className="w-5 h-5 text-red-400 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <span>{success}</span>
          </div>
        )}

        {currentView === 'login' && (
          <div className="max-w-md mx-auto">
            <div className="bg-gray-800 rounded-xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <User className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white">Добро пожаловать обратно</h2>
                <p className="text-gray-400 mt-2">Войдите, чтобы продолжить свое обучение</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Имя пользователя
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Введите имя пользователя"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Введите пароль"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center"
                >
                  {loading ? 'Выполняется вход...' : 'Войти'}
                </button>

                <div className="text-center">
                  <p className="text-gray-400">
                    Нет аккаунта?{' '}
                    <button
                      type="button"
                      onClick={() => setCurrentView('register')}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Зарегистрироваться
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentView === 'register' && (
          <div className="max-w-md mx-auto">
            <div className="bg-gray-800 rounded-xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <User className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white">Создать аккаунт</h2>
                <p className="text-gray-400 mt-2">Присоединяйтесь к нам, чтобы начать изучать программирование</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Полное имя
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Введите ваше полное имя"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Выберите имя пользователя"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="Создайте пароль"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg font-semibold transition-colors duration-200"
                >
                  {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
                </button>

                <div className="text-center">
                  <p className="text-gray-400">
                    Уже есть аккаунт?{' '}
                    <button
                      type="button"
                      onClick={() => setCurrentView('login')}
                      className="text-green-400 hover:text-green-300 font-medium"
                    >
                      Войти
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentView === 'languageSelection' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <Globe className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white">Выберите языки</h2>
                <p className="text-gray-400 mt-2">Выберите ваш известный и целевой языки программирования</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Известный язык (Ваши текущие знания)
                  </label>
                  <select
                    name="knownLanguage"
                    value={formData.knownLanguage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                    required
                  >
                    <option value="">Выберите язык</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Целевой язык (Что вы хотите изучать)
                  </label>
                  <select
                    name="targetLanguage"
                    value={formData.targetLanguage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                    required
                  >
                    <option value="">Выберите язык</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleLanguageSelection}
                  disabled={!formData.knownLanguage || !formData.targetLanguage || loading}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 rounded-lg font-semibold transition-colors duration-200"
                >
                  {loading ? 'Сохранение...' : 'Перейти к урокам'}
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === 'lessons' && (
          <div>
            <div className="mb-8 text-center">
              <BookOpen className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white">Путь обучения</h2>
            </div>

            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors duration-200 cursor-pointer border border-gray-700 hover:border-gray-600"
                  onClick={() => handleStartLesson(lesson)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{lesson.topic}</h3>
                        <p className="text-gray-400 text-sm mt-1">Нажмите, чтобы начать урок</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'lesson' && currentLesson && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-xl p-8 shadow-2xl">
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <BookOpen className="w-8 h-8 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">{currentLesson.topic}</h2>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-300 mb-3">Объяснение</h3>
                  <p className="text-gray-200 whitespace-pre-line">{currentLesson.explanation}</p>
                </div>

                {knownLanguageLessons.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3">Пример на известном языке</h3>
                    {(() => {
                      const matchingLesson = findMatchingKnownLanguageLesson(currentLesson.topic);
                      if (matchingLesson) {
                        return (
                          <pre className="text-green-400 bg-gray-800 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                            {formatCodeForDisplay(matchingLesson.example)}
                          </pre>
                        );
                      } else {
                        return (
                          <p className="text-gray-400 italic">Пример на известном языке не найден.</p>
                        );
                      }
                    })()}
                  </div>
                )}

                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-300 mb-3">Пример на целевом языке</h3>
                  <pre className="text-green-400 bg-gray-800 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {formatCodeForDisplay(currentLesson.example)}
                  </pre>
                </div>

                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-300 mb-3">Упражнение</h3>
                  <p className="text-gray-200 mb-4 whitespace-pre-line">{currentLesson.exercise}</p>
                  
                  <textarea
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    className="w-full h-40 p-4 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Напишите ваше решение здесь..."
                  />
                  
                  <div className="flex space-x-4 mt-4">
                    <button
                      onClick={handleCheckSolution}
                      disabled={loading || !userCode.trim()}
                      className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg font-semibold transition-colors duration-200"
                    >
                      {loading ? 'Проверка...' : 'Проверить решение'}
                      <Play className="w-4 h-4" />
                    </button>
                    
                    {solutionResult !== null && (
                      <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        solutionResult ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {solutionResult ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span>{solutionResult ? 'Правильно!' : 'Попробуйте еще раз!'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentView('lessons')}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors duration-200"
                >
                  Назад к урокам
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
