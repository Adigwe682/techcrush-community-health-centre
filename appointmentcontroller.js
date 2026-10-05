import appointmentData from './appointmentData.js';

//===============================
// CREATE APPOINTMENT
// POST /api/appointments
//===============================

export const createAppointment = (req, res) => {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body
        : {};

    const requiredFields = [
        'patientName',
        'doctorName',
        'appointmentDate',
        'appointmentTime',
        'reasonForVisit'
    ];

    const missingFields = requiredFields.filter(
        (field) =>
            typeof body[field] !== 'string' ||
            body[field].trim() === ''
    );

    if (missingFields.length > 0) {
        return res.status(400).json({
            error: 'All fields are required and must be non-empty strings',
            missingFields
        });
    }

    const {
        "patientName": patientName,
        "doctorName": doctorName,
        "appointmentDate": appointmentDate,
        "appointmentTime": appointmentTime,
        "reasonForVisit": reasonForVisit
    } = body;

    const newAppointment = {
        id: appointmentData.length + 1,
        "patientName": patientName.trim(),
        "doctorName": doctorName.trim(),
        "appointmentDate": appointmentDate.trim(),
        "appointmentTime": appointmentTime.trim(),
        "reasonForVisit": reasonForVisit.trim(),
        "status": 'SCHEDULED',
        "createdAt": new Date().toISOString()
    };

    appointmentData.push(newAppointment);

    return res.status(201).json({
        message: 'Appointment created successfully',
        appointment: newAppointment
    });
};

export const getAppointments = (req, res) => {
    return res.status(200).json({
        totalAppointments: appointmentData.length,
        appointments: appointmentData
    });
};

//===============================
//DAILY APPOINTMENT
// GET /api/appointments/daily
//===============================

export const getDailyAppointments = (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'A date query parameter is required' });
    }

    const dailyAppointments = appointmentData.filter(
        (appointment) => appointment.appointmentDate === date
    );
    return res.status(200).json({
        date,
        totalAppointments: dailyAppointments.length,
        appointments: dailyAppointments
    });
};

//===============================
//RESCHEDULE APPOINTMENT
//PATCH /api/appointments/:id/reschedule
//===============================
export const rescheduleAppointment = (req, res) => {
    const id = Number(req.params.id);
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? req.body
        : {};
    const { appointmentDate, appointmentTime } = body;
    const appointment = appointmentData.find((appointment) => appointment.id === id);

    if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
    }

    if (
        typeof appointmentDate !== 'string' ||
        appointmentDate.trim() === '' ||
        typeof appointmentTime !== 'string' ||
        appointmentTime.trim() === ''
    ) {
        return res.status(400).json({
            error: 'New appointment date and time must be non-empty strings'
        });
    }
    if (appointment.status === 'CANCELLED') {
        return res.status(400).json({
            error: 'Cannot reschedule a cancelled appointment' });
    }

    appointment.appointmentDate = appointmentDate.trim();
    appointment.appointmentTime = appointmentTime.trim();
    appointment.status = 'RESCHEDULED';
    return res.status(200).json({
        message: 'Appointment rescheduled successfully',
        appointment
    });
};

//===============================
//CANCEL APPOINTMENT
//PATCH /api/appointments/:id/cancel
//===============================
export const cancelAppointment = (req, res) => {
const id = Number(req.params.id);
const appointment = appointmentData.find(
    (appointment) => appointment.id === id
);

if (!appointment) {
    return res.status(404).json({
        error: 'Appointment not found' });
}

if (appointment.status === 'CANCELLED') {
    return res.status(400).json({
        error: 'Appointment is already cancelled' });
}
appointment.status = 'CANCELLED';
return res.status(200).json({
    message: 'Appointment cancelled successfully',
    appointment
});
};

//===============================
//CHECK-IN APPOINTMENT
//PATCH /api/appointments/:id/checkin
//===============================
export const checkInAppointment = (req, res) => {
    const id = Number(req.params.id);
    const appointment = appointmentData.find(
        (appointment) => appointment.id === id
    );

    if (!appointment) {
        return res.status(404).json({
            error: 'Appointment not found' });
    }

    if (appointment.status !== 'SCHEDULED') {
        return res.status(400).json({
            error: `Cannot check-in an appointment with status ${appointment.status}` });
        }

            appointment.status = 'CHECKED-IN';
            appointment.checkInTime = new Date().toISOString();

    return res.status(200).json({
        message: 'Patient checked-in successfully',
        appointment
    });
};

//===============================
//NO-SHOW APPOINTMENT
//PATCH /api/appointments/:id/noshow
//===============================

export const markNoShow = (req, res) => {
    const id = Number(req.params.id);

    const appointment = appointmentData.find(
        appointment => appointment.id === id
    );

    if (!appointment) {
        return res.status(404).json({
             error: 'Appointment not found' });
    }

    if (appointment.status !== 'SCHEDULED') {
        return res.status(400).json({
            error: `Cannot mark an appointment with status ${appointment.status} as no-show`
        });
    }

    appointment.status = 'NO-SHOW';

    return res.status(200).json({
        message: 'Appointment marked as no-show successfully',
        appointment
    });
}

//===============================
//GET APPOINTMENT BY STATUS
//GET /api/appointments/status/:status
//===============================

export const getAppointmentStatus = (req, res) => {
    const status = req.params.status.toUpperCase();
    const appointments = appointmentData.filter(
        appointment => appointment.status === status
    );

    return res.status(200).json({
        status,
        totalAppointments: appointments.length,
        appointments
    });
};