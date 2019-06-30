// ==UserScript==
// @name       harmony synel countdown timer
// @namespace  http://goralex.com
// @version    1.2
// @description  counting of working day/month hours
// @include    https://harmony.synel.co.il/eharmonynew
// @copyright  Rishon (goralex.com)
// @grant	   none
//
// ==/UserScript==

(() => {

    const checkIfAttendanceIsExist = () => {
        let selectedRowNodeList = document.getElementById("applicationHost").querySelectorAll("tr.k-state-selected");
        if (selectedRowNodeList.length > 0 && window.getComputedStyle(selectedRowNodeList[0]).visibility === "visible") {
            setTimeout(() => {
                init();
            }, 1500);
        } else {
            setTimeout(checkIfAttendanceIsExist, 50);
        }
    };

    const putHTML = () => {
        let popupHTML =
            '<style>#countdown-clock-popup{position:fixed;top:28px;display:flex;flex-direction:column;font-family:sans-serif;color:#fff;font-weight:100;text-align:center;font-size:45px;background-color:#9c9c9c;padding:25px 15px 0 15px;direction:ltr;z-index:9999}.content{overflow:hidden;transition:height .4s ease;cursor:move}#countdown-clock-popup .text{font-size:45px}#minimize{position:absolute;left:0;top:0;width:100%;height:25px;display:flex;align-items:center;justify-content:center;background-color:#767f76;cursor:pointer}#minimize:hover{background-color:#879487}#minimize .icon{font-size:32px;height:49px;transform:rotate(270deg)}#countdown-clock-popup .today,#countdown-clock-popup .total,#countdown-clock-popup .total-hours{width:315px;display:flex;align-items:baseline;justify-content:space-between}#countdown-clock-popup .total-hours{padding-left:15px}#countdown-clock-popup .today.red,#countdown-clock-popup .total.red{color:#f9d2d2}#countdown-clock-popup .today .one-numbers-container.minus,#countdown-clock-popup .total .one-numbers-container.minus{visibility:hidden}#countdown-clock-popup .today.red .one-numbers-container.minus,#countdown-clock-popup .total.red .one-numbers-container.minus{visibility:visible}#countdown-clock-popup .today,#countdown-clock-popup .total{border-bottom:1px solid #c5c0c0}#countdown-clock-popup .clock-container{display:flex;align-items:baseline}#countdown-clock-popup .one-numbers-container{display:flex}#countdown-clock-popup .points{padding:0 3px}</style>' +
            '<div id="countdown-clock-popup"><div id="minimize"><div class="icon">➧</div></div><div class="content"><div class="today"><div class="clock-container"><div class="one-numbers-container minus">-</div><div class="one-numbers-container"> <span class="hours">--</span> <span class="points">:</span></div><div class="one-numbers-container"> <span class="minutes">--</span> <span class="points">:</span></div><div class="one-numbers-container"> <span class="seconds">--</span></div></div><div class="text"> היום</div></div><div class="total"><div class="clock-container"><div class="one-numbers-container minus">-</div><div class="one-numbers-container"> <span class="hours">--</span> <span class="points">:</span></div><div class="one-numbers-container"> <span class="minutes">--</span> <span class="points">:</span></div><div class="one-numbers-container"> <span class="seconds">--</span></div></div><div class="text"> חודשי</div></div><div class="total-hours"><div class="clock-container"><div class="one-numbers-container"> <span class="hours">--</span> <span class="points">:</span></div><div class="one-numbers-container"> <span class="minutes">--</span></div></div><div class="text"> סה"כ</div></div></div></div>';

        let applicationHostDocument = document.getElementById('applicationHost');
        applicationHostDocument.insertAdjacentHTML('beforeend', popupHTML);

        draggable();
    };

    const getData = (next) => {

        let nowDate = new Date();
        let numberOfDays = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0).getDate();
        let currentMonth = ('0' + (nowDate.getMonth() + 1)).slice(-2);
        let currentYear = nowDate.getFullYear();

        let query = {
            "xFromDate": currentYear + '-' + currentMonth + '-01',
            "xToDate": currentYear + '-' + currentMonth + '-' + numberOfDays,
            "UserNo": window.dataQuery.UserNo,
            "Emp_No": window.dataQuery.EmpNo,
            "LPres": 1,
            "DvcCodes": "",
            "IncludeNonActiveEmp": 0,
            "FilterState": "",
            "isSchedulModule": false,
            "xIsHeb": false,
            "IsGroupUpdate": false,
            "isCheckMadan": false,
            "needGetCheckMadan": true,
            "Updatestatus": -1,
            "GridType": 0,
            "PageNo": window.dataQuery.PageNo,
            "PageLength": "100",
            "Filter": null
        };

        const sessionStorage = JSON.parse(window.sessionStorage.eHrm);

        const http = new XMLHttpRequest();
        const url = 'https://harmony.synel.co.il/eharmonynew/api/Attendance/GetAttendance?query=' + encodeURIComponent(JSON.stringify(query));
        http.open("GET", url);
        http.setRequestHeader('sessionId', sessionStorage.User.sessionId);
        http.send();
        http.onreadystatechange = (e) => {
            if(http.readyState === 4 && http.status === 200){
                next(JSON.parse(http.responseText));
            }
        }
        //get by jQuery
        // $.ajax({
        //     url: 'https://harmony.synel.co.il/eharmonynew/api/Attendance/GetAttendance?query=' + JSON.stringify(query),
        //     type: 'get',
        //     dataType: 'json',
        //     success: function (json) {
        //         next(json);
        //     }
        // });
    };

    const getTimeRemaining = (endTime) => {
        //compare now timestamp and endTime timestamp
        let timestamp = new Date().getTime() - endTime;
        let minus = false;
        if (timestamp < 0) {
            minus = true;
            timestamp *= (-1);
        }
        let seconds = Math.floor((timestamp / 1000) % 60);
        let minutes = Math.floor((timestamp / 1000 / 60) % 60);
        let hours = Math.floor((timestamp / (1000 * 60 * 60)));
        return {
            total: timestamp,
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            minus: minus
        };
    };

    const initializeClock = (todayTime, totalTime, daysDataArray, startTime) => {

        let todayTimeWithMinus = false;
        let totalTimeWithMinus = false;

        let clock = document.getElementById('countdown-clock-popup');

        let hoursElement = clock.querySelector('.today .hours');
        let minutesElement = clock.querySelector('.today .minutes');
        let secondsElement = clock.querySelector('.today .seconds');

        let hoursElementTotal = clock.querySelector('.total .hours');
        let minutesElementTotal = clock.querySelector('.total .minutes');
        let secondsElementTotal = clock.querySelector('.total .seconds');

        let totalHoursElement = clock.querySelector('.total-hours .hours');
        let totalMinutesElement = clock.querySelector('.total-hours .minutes');

        let updateClock = () => {
            let todayUpdateTime = getTimeRemaining(todayTime);
            let totalUpdateTime = getTimeRemaining(totalTime);

            //day
            hoursElement.innerHTML = twoNumbersFormat(todayUpdateTime.hours);
            minutesElement.innerHTML = twoNumbersFormat(todayUpdateTime.minutes);
            secondsElement.innerHTML = twoNumbersFormat(todayUpdateTime.seconds);

            //total
            hoursElementTotal.innerHTML = twoNumbersFormat(totalUpdateTime.hours);
            minutesElementTotal.innerHTML = twoNumbersFormat(totalUpdateTime.minutes);
            secondsElementTotal.innerHTML = twoNumbersFormat(totalUpdateTime.seconds);

            //work hours in the current month
            if(totalUpdateTime.seconds === 59 || true){
                let totalMinutes = 0;

                daysDataArray.forEach((day) => {
                    if(day.NameAbsenceCodeAW === ''){
                        let dayHours = Number(day.Day_TotalAW.split(":")[0]);
                        let dayMinutes = Number(day.Day_TotalAW.split(":")[1]);
                        totalMinutes = totalMinutes + (dayHours * 60) + dayMinutes;
                    }
                });

                let workedTimeToday = 0;
                let todayWorkedMinutes = 0;
                let todayWorkedHours = 0;
                if(startTime){
                    workedTimeToday = new Date().getTime() - new Date(startTime);
                    todayWorkedMinutes = Math.floor((workedTimeToday / 1000 / 60) % 60);
                    todayWorkedHours = Math.floor((workedTimeToday / (1000 * 60 * 60)));
                }
                totalMinutes = totalMinutes + todayWorkedMinutes + todayWorkedHours*60;

                totalHoursElement.innerHTML = Math.floor((totalMinutes / 60));
                totalMinutesElement.innerHTML = twoNumbersFormat(Math.floor((totalMinutes) % 60));
            }

            //validation if time is negative and add or remove class 'red'
            if (todayTimeWithMinus !== todayUpdateTime.minus) {
                let todayElement = clock.querySelector('.today');
                if (todayUpdateTime.minus) {
                    todayElement.classList.add("red");
                } else {
                    todayElement.classList.remove("red");
                }
                todayTimeWithMinus = todayUpdateTime.minus;
            }

            if (totalTimeWithMinus !== totalUpdateTime.minus) {
                let totalElement = clock.querySelector('.total');
                if (totalUpdateTime.minus) {
                    totalElement.classList.add("red");
                } else {
                    totalElement.classList.remove("red");
                }
                totalTimeWithMinus = totalUpdateTime.minus;
            }

            //if (updateTime.total <= 0) {
            //    clearInterval(timeinterval);
            //}
        };

        updateClock();
        const timeinterval = setInterval(updateClock, 1000);
    };

    const locationHashChanged = () => {
        if (location.hash === '#attendance') {
            checkIfAttendanceIsExist();
        } else {
            let popup = document.getElementById('countdown-clock-popup');
            if (popup !== null) {
                popup.parentNode.removeChild(popup);
            }
        }
    };

    const twoNumbersFormat = (number) => {
        let returnString = '--';
        if (number || number == 0) {
            returnString = ('0' + (number.toString() || '--')).slice(-2)
        }
        return returnString;
    };

    locationHashChanged();

    window.onhashchange = locationHashChanged;

    const init = () => {
        console.log('start');
        putHTML();
        getData((returnData) => {
            let daysDataArray = returnData.results;
            let todayArray = [];
            let todayString = new Date().toJSON().slice(0, 10);

            daysDataArray.some((value, key) => {
                if (value.WorkDateA.includes(todayString)) {
                    todayArray.push(value);
                }
            });

            // if (todayArray.length === 0) {
            //     alert(messages.dataProblem);
            //     return;
            // }

            let todayTime = new Date();
            let totalTime = new Date();

            //calc totalTime
            let totalMinutes = 0;

            daysDataArray.forEach((day) => {
                let dayHours = Number(day.MissAW.split(":")[0]);
                let dayMinutes = Number(day.MissAW.split(":")[1]);
                if (day.MissAW[0] === '-') {
                    dayMinutes *= (-1);
                }
                totalMinutes = totalMinutes + (dayHours * 60) + dayMinutes;
            });

            //validation start time and end time
            let todayLast = todayArray[todayArray.length - 1];
            let today = todayArray[0] || {};
            if (Object.keys(today).length === 0) {
                today.Time_startA = '';
                today.Time_endA = '';
            } else {
                today.Time_startA = todayLast.Time_startA;
                today.Time_endA = todayLast.Time_endA;
            }

            if (today.Time_startA === '' || today.Time_endA !== '') {

                alert(messages.shiftNotActive);

                //calc totalTime
                let totalMinutesMinusCoefficient = 1;
                if (totalMinutes < 0) {
                    totalMinutesMinusCoefficient = -1;
                }

                let clock = document.getElementById('countdown-clock-popup');
                if (totalMinutesMinusCoefficient < 0) {
                    clock.querySelector('.total').classList.add("red");
                }

                let hoursElementTotal = clock.querySelector('.total .hours');
                let minutesElementTotal = clock.querySelector('.total .minutes');
                let secondsElementTotal = clock.querySelector('.total .seconds');
                hoursElementTotal.innerHTML = Math.floor((totalMinutes * totalMinutesMinusCoefficient / 60));
                minutesElementTotal.innerHTML = Math.floor((totalMinutes * totalMinutesMinusCoefficient) % 60);
                secondsElementTotal.innerHTML = '00';

                //work hours in the current month
                let totalHoursElement = clock.querySelector('.total-hours .hours');
                let totalMinutesElement = clock.querySelector('.total-hours .minutes');

                let totalMainMinutes = 0;
                daysDataArray.forEach((day) => {
                    if(day.NameAbsenceCodeAW === ''){
                        let dayMainHours = Number(day.Day_TotalAW.split(":")[0]);
                        let dayMainMinutes = Number(day.Day_TotalAW.split(":")[1]);
                        totalMainMinutes = totalMainMinutes + (dayMainHours * 60) + dayMainMinutes;
                    }
                });

                totalHoursElement.innerHTML = Math.floor((totalMainMinutes / 60));
                totalMinutesElement.innerHTML = twoNumbersFormat(Math.floor((totalMainMinutes) % 60));



            } else {
                //calc hours and minuts: start time plus expected time
                let startHour = Number(today.Time_startA.split(":")[0]);
                let startMinutes = Number(today.Time_startA.split(":")[1]);

                let startTime = new Date();
                startTime.setHours(startHour, startMinutes);

                //expectedHours
                let expectedHours = Number(today.ExpectedTimeAW.split(":")[0]);
                let expectedMinutes = Number(today.ExpectedTimeAW.split(":")[1]);
                let expectedTime = new Date();
                expectedTime.setHours(expectedHours, expectedMinutes);

                //daily total
                let dailyTotalHours = Number(today.MissAW.split(":")[0]);
                let dailyTotalMinutes = Number(today.MissAW.split(":")[1]);

                if (today.MissAW[0] === '-') {
                    dailyTotalMinutes *= (-1);
                }

                todayTime.setHours(startHour, startMinutes - (dailyTotalHours * 60) - dailyTotalMinutes);
                //todayTime.setHours(startHour, startMinutes + (expectedHours * 60) + expectedMinutes);

                //calc totalTime
                let totalMinutes = 0;
                daysDataArray.forEach((day) => {
                    let dayHours = Number(day.MissAW.split(":")[0]);
                    let dayMinutes = Number(day.MissAW.split(":")[1]);
                    if (day.MissAW[0] === '-') {
                        dayMinutes *= (-1);
                    }
                    totalMinutes = totalMinutes + (dayHours * 60) + dayMinutes;
                });

                totalTime.setHours(startHour, startMinutes - totalMinutes);
                initializeClock(todayTime, totalTime, daysDataArray, startTime);
            }
        });

        document.getElementById('minimize').onclick = () => {
            this.__toggle = !this.__toggle;
            let popup = document.getElementById('countdown-clock-popup');
            let content = popup.querySelector('.content');
            let minimizeIcon = popup.querySelector('#minimize .icon');
            if (this.__toggle) {
                content.style.height = 0;
                minimizeIcon.style.transform = "rotate(90deg)";
            } else {
                content.style.height = content.scrollHeight + "px";
                minimizeIcon.style.transform = "rotate(270deg)";
            }
        }
    };

    const messages = {
        dataProblem: 'Problem with data. Please, refresh page',
        shiftNotActive: 'Your shift is not active. Please, check if your shift started or not finished. Fix it and refresh page'

    };

    const draggable = () => {
        $('#countdown-clock-popup').draggable({
            handle: '.content',
            containment: '#applicationHost',
            scroll: false
        });
    }

})();
