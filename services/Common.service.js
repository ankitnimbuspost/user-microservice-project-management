const nodemailer = require('nodemailer');

function sendMail(receiver_mail,subject,message)
{
    if(!receiver_mail || !subject || !message)
        return false;
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
    });

    // Set up email data
    let mailOptions = {
        from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`, // Sender address
        to: receiver_mail, // List of receivers
        subject: subject, // Subject line
        html: message // HTML body
    };
    
    // Send email
    return new Promise((resolve,reject)=>{
        let data = transporter.sendMail(mailOptions);
        if(data)
            resolve(data);
        else
            reject(data);
    });
}


async function sendOTP(receiver_email){
    let otp = Math.floor(10000+ Math.random() * 999999);
    let subject = `OTP Email`;
    let body = `<div style="background-color: #e6e6e6; margin-top: 20px; margin-right: 10px; margin-bottom: 20px;">
        <div class="adM"></div>
        <table cellpadding="25" style="margin: 0px auto;">
            <tbody>
                <tr>
                    <td>
                        <table cellpadding="24" style="background: #fff; border: 1px solid #a8adad; width: 584px; color: #4d4b48; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 18px;">
                            <tbody>
                                <tr>
                                    <td>
                                        <p style="margin-top: 0; margin-bottom: 20px;">Dear User,</p>
                                        <p style="margin-top: 0; margin-bottom: 10px;">Your One Time Passcode for completing your transaction is: <b>${otp}</b></p>
                                        <p style="margin-top: 0; margin-bottom: 10px;">Please use this Passcode for OTP authenticate. Do not share this Passcode with anyone.</p>

                                        <p style="margin-top: 0; margin-bottom: 15px;">
                                            Thank you,<br />
                                            ${process.env.APP_NAME}
                                        </p>
                                        <p style="margin-top: 0; margin-bottom: 0px; font-size: 11px;">
                                            Disclaimer: This email and any files transmitted with it are confidential and intended solely for the use of the individual or entity to whom they are addressed.
                                        </p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>`;
    sendMail(receiver_email,subject,body).then((result)=>console.log(result.messageId)).catch((e)=>console.log(e.message));
    return otp;
}
function sendInvitationMail(user,receiver_mail){
    let subject =`${user.f_name+" "+ user.l_name} invited you to join them in ${process.env.APP_NAME}`;
    let body = `<div
    style="
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
        font-size: 14px;
        font-weight: 400;
        letter-spacing: -0.005em;
        color: #091e42;
        line-height: 20px;
        background: #ffffff;
        height: 100%;
        width: 100%;
    "
    >
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
            <tbody>
                <tr>
                    <td align="center">
                        <div style="max-width: 520px; margin: 0 auto;">
                            <div
                                style="
                                    vertical-align: top;
                                    text-align: left;
                                    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
                                    font-size: 14px;
                                    font-weight: 400;
                                    letter-spacing: -0.005em;
                                    color: #091e42;
                                    line-height: 20px;
                                "
                            >
                                <div style="border: solid #ebecf0 1px; border-bottom: none; border-radius: 4px 4px 0 0; max-width: 520px;">
                                    <table
                                        style="
                                            background-image: url('https://ci3.googleusercontent.com/meips/ADKq_Namd0eL0mopCP-jRZLSOnD2W5HHUwYwuGcmfsY49BunHZVwdXSaTzBaHE2Ig-RHDlF_zfDKgxnXDrVeHT773kIwDqdZwrsPTqXIHcB2phJAi2i6S1Q0JuqeeKg=s0-d-e1-ft#https://id-mail-assets.atlassian.com/shared/white-background-10px.png');
                                            background-repeat: repeat;
                                            width: 100%;
                                            border-radius: 4px 4px 0 0;
                                            border-collapse: collapse;
                                        "
                                        width="100%"
                                    >
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <img
                                                        src="https://tse2.mm.bing.net/th?id=OIP.zQx4lAQ4wDnsHavraLPzOQHaHa&pid=Api&P=0&h=220"
                                                        height="45"
                                                        style="border: 0; line-height: 100%; outline: none; text-decoration: none; height: 100%; max-height: 45px; padding: 27px 0px 20px 40px;"
                                                        border="0"
                                                        role="presentation"
                                                        alt="Product logo"
                                                        class="CToWUd"
                                                        data-bit="iit"
                                                    />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div style="margin-bottom: 32px; background: #fafbfc; padding: 40px; border-radius: 0 0 4px 4px; border: solid #ebecf0 1px; border-top: none;">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                                        <tbody>
                                            <tr>
                                                <td align="center">
                                                    <div style="max-width: 520px; margin: 0 auto;">
                                                        <table style="border-collapse: collapse;">
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                        <h1 style="margin: 0px; text-align: left;"><div style="line-height: 33px;">${user.f_name+" "+ user.l_name} invited you to join them in ${process.env.APP_NAME}</div></h1>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td>
                                                                        <div
                                                                            style="
                                                                                font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
                                                                                font-size: 14px;
                                                                                font-weight: 400;
                                                                                letter-spacing: -0.005em;
                                                                                color: #091e42;
                                                                                line-height: 20px;
                                                                                margin-top: 16px;
                                                                                text-align: left;
                                                                            "
                                                                        >
                                                                            Start planning and tracking work with ${user.f_name +" "+ user.l_name } and your team. You can share your work and view what your team is doing.
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td>
                                                                        <div style="display: flex; margin-top: 24px;">
                                                                            <a
                                                                                href="${process.env.FRONTEND_URL}/signup?ref=${user._id}"
                                                                                style="
                                                                                    box-sizing: border-box;
                                                                                    border-radius: 3px;
                                                                                    border-width: 0;
                                                                                    border: none;
                                                                                    display: inline-flex;
                                                                                    font-style: normal;
                                                                                    font-size: inherit;
                                                                                    line-height: 24px;
                                                                                    margin: 0;
                                                                                    outline: none;
                                                                                    padding: 4px 12px;
                                                                                    text-align: center;
                                                                                    vertical-align: middle;
                                                                                    white-space: nowrap;
                                                                                    text-decoration: none;
                                                                                    background: #0052cc;
                                                                                    color: #ffffff;
                                                                                "
                                                                                target="_blank"
                                                                                data-saferedirecturl="#"
                                                                            >
                                                                                Accept Invite
                                                                            </a>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td>
                                                                        <div
                                                                            style="
                                                                                font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
                                                                                font-size: 14px;
                                                                                font-weight: 400;
                                                                                letter-spacing: -0.005em;
                                                                                color: #091e42;
                                                                                line-height: 20px;
                                                                                margin-top: 24px;
                                                                            "
                                                                        >
                                                                            <span
                                                                                style="
                                                                                    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
                                                                                    font-size: 14px;
                                                                                    font-weight: 600;
                                                                                    letter-spacing: -0.003em;
                                                                                    color: #172b4d;
                                                                                    line-height: 16px;
                                                                                "
                                                                            >
                                                                                What is ${process.env.APP_NAME}?
                                                                            </span>
                                                                            A software tool for project and issue tracking across your team. Plan, track and manage your projects in ${process.env.APP_NAME}.
                                                                            <a
                                                                                href="${process.env.FRONTEND_URL}"
                                                                                style="border: none; background: transparent; color: #0052cc; text-decoration: none;"
                                                                                target="_blank"
                                                                                data-saferedirecturl="#"
                                                                            >
                                                                                Learn more
                                                                            </a>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div style="text-align: center; margin-bottom: 16px;">
                                    <div
                                        style="
                                            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
                                            font-size: 14px;
                                            font-weight: normal;
                                            letter-spacing: -0.003em;
                                            color: #172b4d;
                                            line-height: 20px;
                                            margin: 16px 0;
                                        "
                                    >
                                        This message was sent to you by ${process.env.APP_NAME}
                                    </div>
                                    <a
                                        href="${process.env.FRONTEND_URL}"
                                        target="_blank"
                                        data-saferedirecturl="#"
                                    >
                                        <img
                                            src="https://logos-world.net/wp-content/uploads/2020/10/Slack-Logo.png"
                                            height="18"
                                            border="0"
                                            alt="Atlassian logo"
                                            style="border: 0; line-height: 100%; outline: none; text-decoration: none; color: #c1c7d0;"
                                            class="CToWUd"
                                            data-bit="iit"
                                        />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    `;
    sendMail(receiver_mail,subject,body).then((result)=>{
        console.log(result.messageId);
    }).catch((err)=>{
        console.log(err.message);
    });
}
module.exports = {
    sendOTP,
    sendInvitationMail
}