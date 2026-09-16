/**
 * Aurora Theme — login screen.
 *
 * Authentication logic is identical to stock (Formik + login API + invisible
 * reCAPTCHA + checkpoint redirect); only the presentation is redesigned.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import { AuroraField, AuroraPasswordField } from '@/aurora/components/forms';
import { AuroraButton } from '@/aurora/components/Button';

interface Values {
    username: string;
    password: string;
}

const LoginContainer = ({ history }: RouteComponentProps) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });

            return;
        }

        login({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);

                setToken('');
                if (ref.current) ref.current.reset();

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ username: '', password: '' }}
            validationSchema={object().shape({
                username: string().required('A username or email must be provided.'),
                password: string().required('Please enter your account password.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer title="Login to Continue">
                    <AuroraField
                        type="text"
                        label="Username or Email"
                        name="username"
                        disabled={isSubmitting}
                        autoComplete="username"
                        autoFocus
                    />
                    <div style={{ marginTop: '1rem' }}>
                        <AuroraPasswordField
                            label="Password"
                            name="password"
                            disabled={isSubmitting}
                            autoComplete="current-password"
                        />
                    </div>
                    <div style={{ marginTop: '1.25rem' }}>
                        <AuroraButton type="submit" size="xl" block loading={isSubmitting} disabled={isSubmitting}>
                            Login
                        </AuroraButton>
                    </div>
                    {recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size="invisible"
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    )}
                    <Link to="/auth/password" className="aurora-auth-alt">
                        Forgot password?
                    </Link>
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default LoginContainer;
