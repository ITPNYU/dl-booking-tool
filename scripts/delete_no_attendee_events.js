const DocLabAppointmentCalendarId="doc-lab@itp.nyu.edu"
const DocLabShiftCalendarId=""


function deleteEventsWithoutAttendees() {
  //Get target event from doc-lab calender
  const calendar = CalendarApp.getCalendarById(DocLabAppointmentCalendarId); 
  const startDate = new Date();

  //Search 14 days from today
  let endDate = new Date();
  endDate.setDate(startDate.getDate() + 30);
  const events = calendar.getEvents(startDate,endDate); 
  
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    const startTime = new Date(event.getStartTime())


    const guests = event.getGuestList();
    const activeGuests =guests.filter((guest) =>{
      return guest.getGuestStatus().toString() === "YES" || guest.getGuestStatus().toString() === "INVITED" || guest.getGuestStatus().toString() === "MAYBE" 
    })

    // Only one user's event and no attendance
    if(guests.length == 1 && activeGuests.length === 0 ) {

      console.log(`Delete events: ${event.getTitle()}`)
      
      // Delete event
      event.deleteEvent();
      
      //Send emails if user canceled within 48 hours.
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 2);

      if(startTime <= deadline){      
        
        const targetEmail = guests[0].getEmail()
        console.log(`send email to user ${targetEmail}`)
        const formatDate = Utilities.formatDate(new Date(event.getStartTime()), 'EST', 'yyyyMMdd');
        GmailApp.sendEmail(targetEmail, `Documentation Lab MUST READ!`, cancellationMessageForUser); 
        //NOTE:  Canceled: ${event.getTitle()} @ ${event.getStartTime()} (${calendar.getName()})`

      //Send emails if user canceled within 24 hours.
      const staffDeadline = new Date();
      staffDeadline.setDate(staffDeadline.getDate() + 1);

      if(startTime <= staffDeadline){  
        //Send message to doc lab staff
          const shiftcalendar = CalendarApp.getCalendarById(DocLabShiftCalendarId); 
          
          var dayEvents = shiftcalendar.getEventsForDay(startTime);
          const shiftEvents = dayEvents.filter((event)=> new Date(event.getStartTime()) < startTime && startTime < new Date(event.getEndTime()))

          const shiftStaffEmails = shiftEvents.map((event) => {
            const staff = event.getGuestList()
            return staff.map((user) => user.getEmail())
          }).flat()

          //Remove duplication
          const uniqEmailAddress = [...new Set(shiftStaffEmails)];
          uniqEmailAddress.forEach((email) => {
            console.log(email,"shift email")
            console.log(`send email to staff ${email}`)
            GmailApp.sendEmail(email, `Canceled: ${event.getTitle()} @ ${event.getStartTime()} (${calendar.getName()})`, cancellationMessageForStaff);
          })
        }
      }
      console.log(`Deleted Event: ${event.getTitle()}`)
    }
  }
}
const cancellationMessageForStaff = `
Hello, Doc Lab Shooter.

This is an automated email notification letting you know a client has cancelled an appointment during one of your next shift.

- Doc Lab
`

const cancellationMessageForUser = `
Hello.

The Documentation Lab is a limited resource. Cancellations, especially day-of, are both disruptive to Documentation Lab Mentors and unfair to other students who might otherwise have booked that time.

If you cannot keep your appointment we ask that you write your respective student list in good faith and make it known a previously booked slot (including date, time, and kind of appointment e.g. Documentation or Interview) is now available.

Please be advised that future no-shows, late arrivals, or last minute cancellations may result in loss of Documentation Lab privileges.

Respectfully,

- Doc Lab`
