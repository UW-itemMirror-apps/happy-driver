# !important: 
Please create a folder named "happy-driver" on your Dropbox to get this application to work.

# Overview

Our individual Single Page application is called “Happy Driver,” which is a ride information management tool. There are many existing websites and applications designed for drivers who look for riders, but there is no application providing service that can help drivers to manage those scattered carpooling requests. Based on our user research, we found that drivers often chose to use Google calendar to record and manage rides; however, they complained that calendar does not have the appropriate format designed only for recording ride’s information. For solving their problems, we initiated, designed and developed Happy Driver application. It allows users to integrate and manage carpooling ride schedules collected from various carpooling platforms.

# Targeting Users

Our targeting users are drivers who frequently use carpooling services. For providing better user experience, we designed the ride creation form with a straightforward format. In the ride creation form, we only include necessary informations that are useful in carpooling, which are carpooling date, time, destination, and a list of passenger’s information. We use clear labels to clarify where a certain piece of  information should be typed in. Moreover, we used placeholders to indicate what information should be filled into certain cell. Another benefit of using placeholders is to reduce amount of text on our application and provide simple form format; so that, users can save time on recording ride’s information. Considering that carpooling can be repeated activity, we added a functionality that allows users to choose an option from “Non-Repeated” or “Repeated” to meet their needs. Based on the default setting, users can enter three passengers’ contact information; however, they can use the “+” button to add up to six passengers for each ride. The rationale behind this design is that most carpooling drivers own sedan, which has five seats in total including driver. 

Happy Driver is built using itemMirror, AngularJS and Bootstrap. All of the data are stored in Dropbox under a folder named “happy-driver”. In this way, Happy Driver associates with only one certain folder in user’s Dropbox, which is helpful for user to organize information and share with his/her passengers. By building on the top of Dropbox and itemMirror, users working from different devices and OS platforms can collaboratively use Happy Driver. But it is highly recommended that only the driver create and edit the rides,  and share them to his passengers.

Folders labeled with month are created, and rides are phantoms organized in month folders. When creating a ride, the target folder of month is found according to the date of the ride, and then a phantom will be created in that folder; so that, Happy Driver can automatically categorize a ride into the correct month folder based on the carpooling date entered by a user. By having this feature, each ride can be saved into the corresponding month folder. If a user changes a ride date from May to June, Happy Drive can move this ride into June folder. This feature can definitely help users save a lot of time of organizing rides.

# User Experience

The overall interface design uses mint green, light grey, and white colors, which bring a very fresh and clean look, helping users to focus on information. Responsive design is implemented too; so that Happy Driver can have a readable interface, no matter what devices are used to access it. Another important design on application’s main page is that we added a passenger indicator for each ride, which is “xP” in a ellipse. “P” represents Passenger, and number “x” showing in front of P indicates how many passengers are in certain ride. Users can use this indicator to find out the number of passengers without clicking on the ride and looking at detailed information. Moreover, we added spinners for all waiting moments. For example, user may need to wait for seconds for a new ride being saved when the Internet is slow; in this waiting period, he can see a spinner telling him the application is saving the ride’s information for him. Overall, the layout of Happy Driver is very intuitively, and users do not need any special training to use Happy Driver.   

# Features of Happy Driver:

Priority 1: (1)Create a ride as a phantom and organized it to a folder based on its date.  (2) Edit a ride. (3) Enable users to delete a ride. (4) Show or hide passengers’ information when clicking the button beside carpool information on the list. (5) Display all of the rides in different folders on the homepage so that users do not need to open a certain folder to review rides in that month. (6) Present a clear hierarchy of months and rides of each month. (7) Order the rides by date so that the most up to date ones are on the top.

Priority 2: (1) Enable users to add extra passengers by clicking the “+” button. (2) Clear all of the information of a certain passenger when a user clicks the “x” button beside the passenger. (3) If there is no existed folder of a month that a ride should be categorized to, Happy Driver can create the folder before create the ride phantom automatically. (4) Move the ride phantom to a correct folder automatically when the month of the ride has been changed.

Priority 3: (1) Implement responsive design so that users can also have good experience using this application via mobile devices.

All of the features are all fully implemented so far. 
